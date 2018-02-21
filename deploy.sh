# Remove the build directory if it exists, then create a new one.
rm -rf _build && mkdir _build

# Copy all folders over to the _build directory.
cp -R _docs css gallery js third_party _build

# Get the current unix timestamp, then add it to all .js and .css references in index.html.
TIMESTAMP=`date +%s`
sed  -e "s/\.js/\.js?$TIMESTAMP/" -e "s/\.css/\.css?$TIMESTAMP/" index.html > _build/index.html

# Deploy to Firebase Hosting.
firebase deploy
