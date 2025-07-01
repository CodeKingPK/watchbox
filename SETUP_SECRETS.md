# 🔐 Repository Secrets Setup Guide

To enable automatic APK building and releases, you need to set up the following repository secrets:

## Required Secrets

### 1. EXPO_TOKEN
This is required for EAS builds and authentication.

**How to get it:**
1. Go to [https://expo.dev/](https://expo.dev/)
2. Sign in or create an account
3. Go to [https://expo.dev/accounts/pritamouli/settings/access-tokens](https://expo.dev/accounts/pritamouli/settings/access-tokens)
4. Click "Create Token"
5. Give it a name like "GitHub Actions"
6. Copy the generated token

**How to add it to GitHub:**
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Name: `EXPO_TOKEN`
6. Value: Paste your Expo token
7. Click "Add secret"

### 2. GITHUB_TOKEN (Already available)
This is automatically provided by GitHub Actions for creating releases.

## Testing the Workflow

After setting up the secrets:

1. **Manual trigger**: Go to Actions tab → "Build and Release APK" → "Run workflow"
2. **Tag trigger**: Create and push a tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## Troubleshooting

### Common Issues:
- **Invalid EXPO_TOKEN**: Make sure the token is correctly copied and hasn't expired
- **Build failures**: Check the Actions logs for detailed error messages
- **Keystore issues**: The workflow will automatically generate a keystore for Android signing

### Getting Help:
- Check [EAS Build documentation](https://docs.expo.dev/build/introduction/)
- Review [GitHub Actions logs](https://github.com/CodeKingPK/watchbox/actions)
- Create an issue in this repository if problems persist

## Project Configuration

The workflow uses these configuration files:
- `eas.json` - EAS build configuration
- `app.json` - Expo app configuration
- `.github/workflows/build-apk.yml` - GitHub Actions workflow

Make sure these files are properly configured before running builds.
