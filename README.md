
# Chess Game

## Step 1: Initialize a new React Native (TypeScript) project

npx react-native init ChessApp --template react-native-template-typescript

cd ChessApp

## Step 2: Replace the template’s App.tsx

Open ChessApp/App.tsx in your editor and overwrite it with the provided code

## Step 3: Android setup

Install Android Studio

In Android Studio → SDK Manager, install “Android SDK” and “Android SDK Platform-tools.”

Ensure you have an ANDROID_HOME (or ANDROID_SDK_ROOT) env var pointing at your SDK folder

## Step 4: Run on Android

npx react-native run-android
If everything’s set up, you’ll see the chessboard appear in the emulator.
