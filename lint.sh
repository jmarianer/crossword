node_modules/tslint/bin/tslint *.ts templates/* -t stylish
node_modules/lesshint/bin/lesshint style.less
grep '\s$' * -r --exclude-dir node_modules -l
