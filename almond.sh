
# generate the bootstraps with requirejs
time r.js -o conf

# wrap almond around the pre-domready bootstrap
time r.js -o baseUrl=. name=almond.js uglify=none include=tmp/bootstraps/predomready.js out=tmp/bootstraps/predomready.almond.js

# copy article bootstrap to htdocs
cp -v tmp/bootstraps/article.js public_html/article.js

# embed the pre-domready bootstrap in the index.html
ruby -e 'puts IO.read("public_html/index.template").gsub(/PREDOMREADYBOOTSTRAP/, IO.read("tmp/bootstraps/predomready.almond.js"))' > public_html/index.html

