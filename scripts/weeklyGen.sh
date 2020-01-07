#!/bin/bash
# run the following in scripts dir

HOMEDIR=$(dirname $(pwd))
IMGPATH=images/$(date +'%Y/%m/%d')
IMGDIR=$HOMEDIR/static/$IMGPATH
POSTDIR=$HOMEDIR/content/posts/$(date +'%Y/%m')
POSTNAME=$(date +'%Y-%m-%d')-weekly.md
POST=$POSTDIR/$POSTNAME

cd $IMGDIR
mkdir thumbnail
find . -type f -exec cp {} ./thumbnail \;
sips -Z 1200 thumbnail/*
cd $HOMEDIR
hugo new --kind weekly posts/$(date +'%Y/%m')/$POSTNAME

d1=$(date -jf "%Y-%m-%d %H:%M" "2019-05-04 00:00" +%s)
d2=$(date +%s)
WEEKCNT=$(( (d2 - d1) / 86400 / 7 + 1)) 

sed -i '' "s|title:.*|title: \"[Weekly-$WEEKCNT] $(date +'%Y.%m.%d')\"|" $POST
sed -i '' "s|thumbnailImage:.*|thumbnailImage: /$IMGPATH\/thumbnail\/thumbnail.JPG|" $POST
sed -i '' "s|coverImage:.*|coverImage: /$IMGPATH\/cover.JPG|" $POST
lf=$'\n'
sed -i '' "s|<!--more-->|Weekly visual project - $(date +'%Y/%m/%d')\\$lf&|" $POST

echo '' >> $POST
echo '# The street' >> $POST
ls -1 $IMGDIR |\
sed '/thumbnail/d' |\
xargs -I{} echo "{{< image classes=\"fancybox fig-100\" src=\"/$IMGPATH/{}\" thumbnail=\"/$IMGPATH/thumbnail/{}\" title=\"↑{}\" >}}" >> $POST
echo '' >> $POST
echo '# The excerpt' >> $POST
echo '> ...   ' >> $POST
echo 'Excerpt From: ' >> $POST

exit 0;