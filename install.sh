VSIX_FILE="projects-linux-x64-0.0.1.vsix"

rm $VSIX_FILE
npm run package
codium --force --install-extension $VSIX_FILE