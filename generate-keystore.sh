#!/bin/bash

# Настройки для ключа
STORE_PASSWORD=domgoapp
KEY_PASSWORD=domgoapp
KEY_ALIAS=domgo-key
VALIDITY=10000

# Создаем директорию, если не существует
mkdir -p android/app/keystore

# Удаляем старый keystore, если существует
rm -f android/app/keystore/release-key.keystore

# Создаем keystore автоматически без запросов
keytool -genkeypair -v \
  -keystore android/app/keystore/release-key.keystore \
  -alias $KEY_ALIAS \
  -keyalg RSA \
  -keysize 2048 \
  -validity $VALIDITY \
  -dname "CN=DomGo App, OU=Mobile, O=DomGo, L=Unknown, ST=Unknown, C=RS" \
  -storepass $STORE_PASSWORD \
  -keypass $KEY_PASSWORD

# Создаем gradle.properties с настройками для подписи
cat > android/gradle.properties << EOF
# Project-wide Gradle settings.

# IDE (e.g. Android Studio) users:
# Gradle settings configured through the IDE *will override*
# any settings specified in this file.

# For more details on how to configure your build environment visit
# http://www.gradle.org/docs/current/userguide/build_environment.html

# Specifies the JVM arguments used for the daemon process.
# The setting is particularly useful for tweaking memory settings.
# Default value: -Xmx512m -XX:MaxMetaspaceSize=256m
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m

# When configured, Gradle will run in incubating parallel mode.
# This option should only be used with decoupled projects. More details, visit
# http://www.gradle.org/docs/current/userguide/multi_project_builds.html#sec:decoupled_projects
# org.gradle.parallel=true

# AndroidX package structure to make it clearer which packages are bundled with the
# Android operating system, and which are packaged with your app's APK
# https://developer.android.com/topic/libraries/support-library/androidx-rn
android.useAndroidX=true
# Automatically convert third-party libraries to use AndroidX
android.enableJetifier=true

# Use this property to specify which architecture you want to build.
# You can also override it from the CLI using
# ./gradlew <task> -PreactNativeArchitectures=x86_64
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64

# Use this property to enable support to the new architecture.
# This will allow you to use TurboModules and the Fabric render in
# your application. You should enable this flag either if you want
# to write custom TurboModules/Fabric components OR use libraries that
# are providing them.
newArchEnabled=false

# Use this property to enable or disable the Hermes JS engine.
# If set to false, you will be using JSC instead.
hermesEnabled=true

# Настройки подписи APK
MYAPP_UPLOAD_STORE_FILE=keystore/release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=domgo-key
MYAPP_UPLOAD_STORE_PASSWORD=domgoapp
MYAPP_UPLOAD_KEY_PASSWORD=domgoapp
EOF

# Настраиваем build.gradle для подписи
cat > android/app/build.gradle.release << EOF
// Добавьте эти строки в android/app/build.gradle в секцию android { ... }

    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
EOF

echo "Ключ успешно создан в android/app/keystore/release-key.keystore"
echo "Информация о ключе:"
echo "  Alias: $KEY_ALIAS"
echo "  Пароль хранилища: $STORE_PASSWORD" 
echo "  Пароль ключа: $KEY_PASSWORD"
echo ""
echo "Параметры сохранены в android/gradle.properties"
echo "Настройки для build.gradle сохранены в android/app/build.gradle.release"
echo "Пожалуйста, добавьте содержимое build.gradle.release в соответствующий раздел android/app/build.gradle"
