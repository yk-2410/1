import React, { useState } from 'react';
import {
  Workflow,
  Copy,
  Check,
  FileCode,
  Terminal,
  ShieldCheck,
  Layers,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  PlayCircle,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

const WORKFLOW_YAML = `name: Build Android Debug APK

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-apk:
    name: Build Debug APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Set up Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.7'

      - name: Grant Execute Permission for Gradle Wrapper
        run: |
          if [ -f "./gradlew" ]; then
            chmod +x ./gradlew
          else
            echo "gradlew not found, generating wrapper..."
            gradle wrapper --gradle-version 8.7
            chmod +x ./gradlew
          fi

      - name: Build with Gradle
        run: ./gradlew assembleDebug --no-daemon --stacktrace

      - name: Locate Debug APK
        id: locate_apk
        run: |
          echo "Locating built debug APK..."
          FOUND_APK=$(find . -type f -name "*debug*.apk" -path "*/outputs/apk/*" | head -n 1)

          if [ -z "$FOUND_APK" ]; then
            FOUND_APK=$(find . -type f -name "*.apk" -path "*/build/*" | head -n 1)
          fi

          if [ -z "$FOUND_APK" ] || [ ! -f "$FOUND_APK" ]; then
            echo "::error::No debug APK found after assembleDebug"
            exit 1
          fi

          echo "Found APK at: $FOUND_APK"
          TARGET_DIR="build/outputs/apk/debug"
          TARGET_APK="$TARGET_DIR/app-debug.apk"

          mkdir -p "$TARGET_DIR"

          # Only copy if source and destination are different paths
          if [ "$(realpath "$FOUND_APK")" != "$(realpath -m "$TARGET_APK")" ]; then
            cp -f "$FOUND_APK" "$TARGET_APK"
          fi

          echo "apk_file=$TARGET_APK" >> "$GITHUB_OUTPUT"

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Xiaomi-Notification-Fix-Debug
          path: \${{ steps.locate_apk.outputs.apk_file }}
          if-no-files-found: error
          retention-days: 30
`;

const BUILD_GRADLE = `plugins {
    id 'com.android.application' version '8.4.2' apply true
}

android {
    namespace 'com.hanh.gmsprotect'
    compileSdk 34

    defaultConfig {
        applicationId 'com.hanh.gmsprotect'
        minSdk 26
        targetSdk 34
        versionCode 1
        versionName "1.0.0"


    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    lint {
        abortOnError false
        checkReleaseBuilds false
        disable 'ProtectedPermissions'
    }

    packaging {
        resources {
            excludes += '/META-INF/{AL2.0,LGPL2.1}'
        }
    }
}

base {
    archivesName = 'app'
}

dependencies {
    // Pure Android framework APIs - no external dependencies required
}`;

const SETTINGS_GRADLE = `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "GMS-Protect"`;

const GRADLE_WRAPPER_PROPS = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`;

const ICON_RESOLUTIONS = [
  { density: 'xxxhdpi', size: '192 x 192', file: 'res/mipmap-xxxhdpi/ic_launcher.png' },
  { density: 'xxhdpi', size: '144 x 144', file: 'res/mipmap-xxhdpi/ic_launcher.png' },
  { density: 'xhdpi', size: '96 x 96', file: 'res/mipmap-xhdpi/ic_launcher.png' },
  { density: 'hdpi', size: '72 x 72', file: 'res/mipmap-hdpi/ic_launcher.png' },
  { density: 'mdpi', size: '48 x 48', file: 'res/mipmap-mdpi/ic_launcher.png' },
  { density: 'adaptive foreground', size: '512 x 512', file: 'res/drawable/ic_launcher_foreground.png' },
];

export default function App() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'icon' | 'workflow' | 'gradle' | 'structure' | 'guide'>('icon');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/icon.png"
              alt="GMS-Protect Icon"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/20 object-cover border border-slate-700/60"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-semibold text-lg text-white">Xiaomi Notification Fix (GMS-Protect)</h1>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Icon Updated
                </span>
              </div>
              <p className="text-xs text-slate-400">GitHub Actions Android APK Build Automation & Mipmap Icon Assets</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              JDK 17 + Gradle 8.7
            </span>
          </div>
        </div>
      </header>

      {/* Hero Summary Cards */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              App Icon Status
              <ImageIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400">Đã cập nhật</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Đồng bộ toàn bộ mipmap & adaptive icon</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              Workflow Trigger
              <Workflow className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-lg font-bold text-white">push: [main]</div>
            <div className="text-xs text-slate-400 mt-1">Hỗ trợ workflow_dispatch thủ công</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              Artifact Name
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400 truncate">Xiaomi-Notification-Fix-Debug</div>
            <div className="text-xs text-slate-400 mt-1">File xuất xưởng: app-debug.apk</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              Ký số & Deploy
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-slate-200">Debug Keystore (Auto)</div>
            <div className="text-xs text-slate-400 mt-1">Không cần keystore riêng, tự ký debug</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('icon')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 shrink-0 ${
              activeTab === 'icon'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Biểu tượng (Icon Mới)</span>
          </button>

          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 shrink-0 ${
              activeTab === 'workflow'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>.github/workflows/build-apk.yml</span>
          </button>

          <button
            onClick={() => setActiveTab('gradle')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 shrink-0 ${
              activeTab === 'gradle'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Cấu hình Gradle</span>
          </button>

          <button
            onClick={() => setActiveTab('structure')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 shrink-0 ${
              activeTab === 'structure'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Cấu trúc Project</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 shrink-0 ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>Hướng dẫn chạy & Tải APK</span>
          </button>
        </div>

        {/* Tab 0: Icon Showcase */}
        {activeTab === 'icon' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left side preview */}
                <div className="md:col-span-5 flex flex-col items-center text-center">
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/30 to-blue-500/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500"></div>
                    <img
                      src="/icon.png"
                      alt="GMS-Protect App Icon"
                      referrerPolicy="no-referrer"
                      className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl shadow-2xl border-2 border-slate-700/80 object-cover"
                    />
                  </div>
                  <div className="mt-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Icon chính thức • GMS-Protect
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 max-w-xs">
                    Mascot Android 3D với khiên bảo vệ Google G và năng lượng hào quang xoay quanh.
                  </p>
                </div>

                {/* Right side resolution details */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      Đã đồng bộ vào toàn bộ tài nguyên Android
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Icon đã được chuyển đổi chính xác thành các độ phân giải tương thích chuẩn Android và HyperOS:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {ICON_RESOLUTIONS.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-emerald-400 uppercase">{item.density}</div>
                          <div className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">{item.file}</div>
                        </div>
                        <span className="text-xs font-mono font-medium text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {item.size}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Đặc điểm kỹ thuật:
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
                      <li>Hỗ trợ cả biểu tượng thông thường (<code>ic_launcher</code>) và biểu tượng tròn (<code>ic_launcher_round</code>).</li>
                      <li>Cập nhật màu nền Adaptive Icon (<code>ic_launcher_background.xml</code>) sang sắc thái Dark Navy (<code>#080c1d</code>).</li>
                      <li>Tích hợp icon web và favicon (<code>/favicon.png</code>, <code>/icon.png</code>).</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Workflow YAML */}
        {activeTab === 'workflow' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-slate-850 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="text-xs font-mono text-slate-400 ml-2">.github/workflows/build-apk.yml</span>
                </div>
                <button
                  onClick={() => handleCopy(WORKFLOW_YAML, 'workflow')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
                >
                  {copiedKey === 'workflow' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép YAML</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-6 text-xs sm:text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed bg-slate-950/80">
                <code>{WORKFLOW_YAML}</code>
              </pre>
            </div>

            {/* Workflow Step Explanations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Workflow className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">1. Kích hoạt linh hoạt</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Tự động chạy mỗi khi có commit push lên branch <code className="text-emerald-400">main</code>, đồng thời cho phép nhấn nút <strong>Run workflow</strong> thủ công qua giao diện GitHub.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">2. Môi trường Ubuntu + JDK 17</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Sử dụng distribution Eclipse Temurin JDK 17 tương thích tối ưu với Android Gradle Plugin 8.x, tích hợp sẵn cache dependency giúp tăng tốc build.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">3. Tự động cấp quyền gradlew</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Tránh lỗi <em>Permission denied</em> phổ biến trên Linux runner bằng cách tự động kiểm tra và chạy <code className="text-emerald-400">chmod +x ./gradlew</code> trước khi build.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">4. Đảm bảo tên Artifact chuẩn</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Tự động tìm kiếm file APK kết quả ở bất kỳ module nào, đồng bộ thành <code className="text-emerald-400">app-debug.apk</code> và upload thành artifact <code className="text-emerald-400">Xiaomi-Notification-Fix-Debug</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Gradle Configuration */}
        {activeTab === 'gradle' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-slate-850 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono text-slate-300">build.gradle</span>
                </div>
                <button
                  onClick={() => handleCopy(BUILD_GRADLE, 'build.gradle')}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
                >
                  {copiedKey === 'build.gradle' ? (
                    <span className="text-emerald-400">Đã sao chép!</span>
                  ) : (
                    <span>Sao chép</span>
                  )}
                </button>
              </div>
              <pre className="p-6 text-xs sm:text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed bg-slate-950/80">
                <code>{BUILD_GRADLE}</code>
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="bg-slate-850 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-mono text-slate-300">settings.gradle</span>
                  </div>
                  <button
                    onClick={() => handleCopy(SETTINGS_GRADLE, 'settings.gradle')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Sao chép
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed bg-slate-950/80">
                  <code>{SETTINGS_GRADLE}</code>
                </pre>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="bg-slate-850 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-mono text-slate-300">gradle/wrapper/gradle-wrapper.properties</span>
                  </div>
                  <button
                    onClick={() => handleCopy(GRADLE_WRAPPER_PROPS, 'wrapper')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Sao chép
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed bg-slate-950/80">
                  <code>{GRADLE_WRAPPER_PROPS}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Project Structure */}
        {activeTab === 'structure' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-emerald-400" />
                Cây thư mục thực tế của dự án
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Dự án sử dụng cấu trúc root module cho Android để tương thích hoàn toàn với thư mục <code className="text-emerald-400">src/main</code> sẵn có của GMS Protect:
              </p>

              <div className="bg-slate-950 rounded-xl p-5 font-mono text-xs text-slate-300 leading-relaxed border border-slate-800 space-y-1">
                <div>📁 <span className="text-emerald-400">.github/workflows/</span></div>
                <div className="pl-6 text-slate-200">└── 📄 build-apk.yml <span className="text-emerald-400">← [Workflow build APK tự động]</span></div>
                <div>📁 <span className="text-blue-400">gradle/wrapper/</span></div>
                <div className="pl-6 text-slate-400">├── 📄 gradle-wrapper.jar <span className="text-slate-500">(Wrapper binary)</span></div>
                <div className="pl-6 text-slate-400">└── 📄 gradle-wrapper.properties <span className="text-teal-400">(Gradle 8.7)</span></div>
                <div>📁 <span className="text-amber-400">src/main/</span></div>
                <div className="pl-6 text-slate-300">├── 📄 AndroidManifest.xml <span className="text-slate-400">(Quyền & Service HyperOS)</span></div>
                <div className="pl-6 text-slate-300">├── 📁 java/com/hanh/gmsprotect/ <span className="text-slate-400">(MilletWatch, Aurogon, MainActivity, ...)</span></div>
                <div className="pl-6 text-slate-300">└── 📁 res/ <span className="text-slate-400">(Giao diện, chuỗi vi/en, icons mới đã cập nhật)</span></div>
                <div>📄 build.gradle <span className="text-emerald-400">← [AGP 8.4.2, SDK 34, compile options JDK 17]</span></div>
                <div>📄 settings.gradle <span className="text-blue-400">← [Google & MavenCentral repos]</span></div>
                <div>📄 gradle.properties <span className="text-slate-400">← [JVM args & AndroidX]</span></div>
                <div>📄 gradlew & gradlew.bat <span className="text-emerald-400">← [Gradle Wrapper scripts đã cấp quyền]</span></div>
                <div>📄 README.md <span className="text-slate-400">← [Tài liệu hướng dẫn GMS Protect]</span></div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-white mb-2">Các thành phần chính của GMS Protect</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-xs font-semibold text-emerald-400">MilletNoRestrict & JobService</div>
                  <p className="text-xs text-slate-400 mt-1">Duy trì Google Play services trong nhóm MILLET để tránh bị kill khi tắt màn hình trên HyperOS.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-xs font-semibold text-teal-400">AurogonAllowlistService</div>
                  <p className="text-xs text-slate-400 mt-1">Giữ runtime allowlist của HyperOS Aurogon luôn tươi mới cho GMS.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-xs font-semibold text-blue-400">FcmReconnect & Compatibility</div>
                  <p className="text-xs text-slate-400 mt-1">Kiểm tra kết nối GCM/FCM và khôi phục khi mất kết nối mạng ngầm.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Step-by-step Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Các bước đưa lên GitHub và tải APK tự động</h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-sm border border-emerald-500/30">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">Commit và Push lên GitHub</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-2">
                      Đưa file workflow, icon mới và cấu hình Gradle lên nhánh <code>main</code> của repository:
                    </p>
                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 border border-slate-800 flex items-center justify-between">
                      <code>git add . && git commit -m "Update app icon and add GitHub Actions build" && git push origin main</code>
                      <button
                        onClick={() => handleCopy('git add . && git commit -m "Update app icon and add GitHub Actions build" && git push origin main', 'git')}
                        className="text-xs text-slate-400 hover:text-white ml-2"
                      >
                        {copiedKey === 'git' ? 'Đã chép' : 'Chép'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-sm border border-blue-500/30">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">Theo dõi tiến trình Build trên GitHub Actions</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Truy cập tab <strong>Actions</strong> trên GitHub repository. Workflow <strong>Build Android Debug APK</strong> sẽ tự động chạy trong khoảng 1–2 phút. Bạn cũng có thể bấm <strong>Run workflow</strong> bất kỳ lúc nào để build thủ công.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0 text-sm border border-purple-500/30">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">Tải file APK đã build thành công</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Sau khi build hoàn tất có dấu tích xanh (Success), cuộn xuống mục <strong>Artifacts</strong> tại trang chi tiết của lần chạy và tải gói:
                    </p>
                    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Artifact: Xiaomi-Notification-Fix-Debug (chứa app-debug.apk)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-3 text-amber-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
              <div className="text-xs leading-relaxed">
                <strong>Lưu ý quan trọng khi cài đặt trên HyperOS:</strong> Vì đây là bản Debug APK tự động, hệ thống sử dụng Android Debug Key tiêu chuẩn. Hãy bật tùy chọn <em>Cài đặt qua USB</em> hoặc chọn cho phép cài đặt ứng dụng từ nguồn ngoài khi được hệ điều hành cảnh báo.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        Xiaomi Notification Fix (GMS-Protect) • Automated CI/CD by GitHub Actions
      </footer>
    </div>
  );
}
