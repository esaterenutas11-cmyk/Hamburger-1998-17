# Xcode projesine Firebase dosyasını ve "Apple ile giriş" yetkisini ekler, imza takımını ayarlar.
# macOS'ta (GitHub Actions) çalışır: CocoaPods ile gelen xcodeproj gem'ini kullanır.
#   ruby scripts/ios-project.rb [TAKIM_KIMLIGI]
require 'xcodeproj'

root = File.expand_path('..', __dir__)
proj_path = File.join(root, 'ios/App/App.xcodeproj')
project = Xcodeproj::Project.open(proj_path)
target = project.targets.find { |t| t.name == 'App' } or abort('App hedefi bulunamadı')
group = project.main_group.find_subpath('App', false) or abort('App grubu bulunamadı')
team = (ARGV[0] || ENV['APPLE_TEAM_ID'] || '').strip

gs = File.join(root, 'ios/App/App/GoogleService-Info.plist')
if File.exist?(gs) && group.files.none? { |f| f.path == 'GoogleService-Info.plist' }
  ref = group.new_reference('GoogleService-Info.plist')
  target.resources_build_phase.add_file_reference(ref, true)
  puts '• GoogleService-Info.plist projeye eklendi'
end

ent = File.join(root, 'ios/App/App/App.entitlements')
if File.exist?(ent)
  group.new_reference('App.entitlements') if group.files.none? { |f| f.path == 'App.entitlements' }
  puts '• Apple ile giriş yetkisi eklendi'
end

target.build_configurations.each do |c|
  s = c.build_settings
  s['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements' if File.exist?(ent)
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0' if s['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15
  s['CODE_SIGN_STYLE'] = 'Automatic'
  s['DEVELOPMENT_TEAM'] = team unless team.empty?
  s['INFOPLIST_KEY_LSApplicationCategoryType'] = 'public.app-category.simulation-games'
end
project.save
puts "• Xcode projesi kaydedildi#{team.empty? ? '' : " (takım #{team})"}"
