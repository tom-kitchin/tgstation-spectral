#!/bin/bash
##
# Rebuild tgstation server file to run the indicated map.
# usage: build-with-map.sh <map_name>
# Should be run inside the server directory.
##
mapname="-M${1-tgstation2}"
bash tools/travis/dm.sh ${mapname} tgstation.dme
