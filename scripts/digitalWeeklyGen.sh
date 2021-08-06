#!/bin/bash
# run the following in scripts dir

TYPE="digital"

HOMEDIR=$(dirname $(pwd))
IMGDATEPATH=$(date +'%Y/%m/%d')
IMGDIR=$HOMEDIR/static/gallery/$TYPE/$IMGDATEPATH
THUMBNAILDIR=$HOMEDIR/static/images/$IMGDATEPATH
POSTDIR=$HOMEDIR/content/gallery/$TYPE/$(date +'%Y/%m/%d')
POSTNAME=$(date +'%Y-%m-%d')-weekly.md
POSTNAME_ZH=$(date +'%Y-%m-%d')-weekly.zh.md
POST=$POSTDIR/$POSTNAME
POST_ZH=$POSTDIR/$POSTNAME_ZH

cd $IMGDIR
mkdir -p $THUMBNAILDIR
find . -type f -exec cp {} $THUMBNAILDIR \;
cd $THUMBNAILDIR
sips -Z 1200 *
cd $HOMEDIR
hugo new --kind weekly gallery/$TYPE/$(date +'%Y/%m/%d')/$POSTNAME
hugo new --kind weekly gallery/$TYPE/$(date +'%Y/%m/%d')/$POSTNAME_ZH

d1=$(date -jf "%Y-%m-%d %H:%M" "2019-05-04 00:00" +%s)
d2=$(date +%s)
WEEKCNT=$(( (d2 - d1) / 86400 / 7 + 1)) 

sed -i '' "s|title:.*|title: \"[Weekly-$WEEKCNT] $(date +'%Y.%m.%d')\"|" $POST
sed -i '' "s|title:.*|title: \"[Weekly-$WEEKCNT] $(date +'%Y.%m.%d')\"|" $POST_ZH
sed -i '' "s|featured_image:.*|featured_image: $IMGDATEPATH\/???.JPG|" $POST
sed -i '' "s|featured_image:.*|featured_image: $IMGDATEPATH\/???.JPG|" $POST_ZH
lf=$'\n'
sed -i '' "s|<!--more-->|Weekly visual project - $(date +'%Y/%m/%d')\\$lf&|" $POST
sed -i '' "s|<!--more-->|Weekly visual project - $(date +'%Y/%m/%d')\\$lf&|" $POST_ZH

# echo '' >> $POST
# echo '# The street' >> $POST
# ls -1 $IMGDIR |\
# sed '/thumbnail/d' |\
# xargs -I{} echo "{{< image classes=\"fancybox fig-100\" src=\"/$IMGPATH/{}\" thumbnail=\"/$IMGPATH/thumbnail/{}\" title=\"↑{}\" >}}" >> $POST

# echo '' >> $POST
# echo '# The excerpt' >> $POST
# echo '> ...   ' >> $POST
# echo 'Excerpt From: ' >> $POST

exit 0;