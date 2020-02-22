#!/bin/bash
# run the following in scripts dir

TYPE="film"

HOMEDIR=$(dirname $(pwd))
IMGDATEPATH=$(date +'%Y/%m/%d')
IMGDIR=$HOMEDIR/static/gallery/$TYPE/$IMGDATEPATH
THUMBNAILDIR=$HOMEDIR/static/images/$IMGDATEPATH
POSTDIR=$HOMEDIR/content/gallery/$TYPE/$(date +'%Y/%m/%d')
POSTNAME=$(date +'%Y-%m-%d')-weekly.md
POST=$POSTDIR/$POSTNAME

cd $IMGDIR
mkdir -p $THUMBNAILDIR
find . -type f -exec cp {} $THUMBNAILDIR \;
cd $THUMBNAILDIR
sips -Z 1200 *
cd $HOMEDIR
hugo new --kind weekly gallery/$TYPE/$(date +'%Y/%m/%d')/$POSTNAME

d1=$(date -jf "%Y-%m-%d %H:%M" "2019-05-04 00:00" +%s)
d2=$(date +%s)
WEEKCNT=$(( (d2 - d1) / 86400 / 7 + 1)) 

sed -i '' "s|title:.*|title: \"[Weekly-$WEEKCNT] $(date +'%Y.%m.%d')\"|" $POST
sed -i '' "s|featured_image:.*|featured_image: $IMGDATEPATH\/???.jpg|" $POST
lf=$'\n'
sed -i '' "s|<!--more-->|Weekly visual project - $(date +'%Y/%m/%d')\\$lf&|" $POST

echo '' >> $POST
echo '# The excerpt' >> $POST
echo '> ...   ' >> $POST
echo 'Excerpt From: ' >> $POST

exit 0;