#!/bin/bash
#
# Create the extension pack.
# v1.0, 20150113  Jorge Morgado
#

NAME="CentreonStatus"

VERSION=`cat manifest.json | python -c "import json,sys;sys.stdout.write(json.dumps(json.load(sys.stdin)['version']))" | sed s/\"//g`

FILES="_locales css images js manifest.json views"

EXTPACK="../${NAME}-${VERSION}.zip"

if [ -f ${EXTPACK} ]; then
  echo "Error: Extension pack already exists (${EXTPACK})"
else
  zip -r ${EXTPACK} ${FILES}
fi
