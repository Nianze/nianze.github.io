---
title: "Computer Music Study 3: Music Based on Algo"
date: 2020-03-07T11:49:56-05:00
series:
- computer music
categories:
- music
tags:
- music
- computer music
slug: "Algorithmic Computer Music"
featured_image: 2020/03/07/cover.jpg
---

Recently I just learned that Charles Dodge is the pioneer in sonification and his music piece [Earth's Magnetc Field](https://sonificationart.wordpress.com/2017/06/01/earths-magnetic-field-realizations-in-computed-electronic-sound/) is inspiring.
<!--more-->

# Earth’s Magnetic Field

In 1970, Columbia-Princeton Electronic Music Center, together with three physicists Bruce R. Boller, Carl Frederick and Stephen G. Ungar, Dodge sonified the variations in the earth’s magnetic field and composed Earth’s Magnetic Field, which is a seminal piece of sonification art and realized in Computed Electronic Sound.

## Mapping from scientific data to musical sounds

Solar winds make the earth’s magnetic field fluctuate and these fluctuations are registered in the Kp-index, which is a global geomagnetic storm index introduced by Bartels in 1939, and has a scale from 0 to 9, where 0 means that there is very little geomagnetic activity and 9 means extreme geomagnetic storming. The global Kp-index is derived by calculating a weighted average of K-indices from a network of geomagnetic observatories, each of which has their own local K-index. Based on the 2920 Kp-indeces in 1961, Dodge made the music piece [Earth's Magnetc Field](https://youtu.be/j5MHsnc67yw)

Firstly, the values were tabulated in a so-called Bartel Musical Diagram. One of the physicists had made a five-line staff representation of the data and mapped the values to both a 7-note diatonic scale as well as a 12-note chromatic scale, with a four octave span, or 45 notes (the average span of an instrument).

{{< img src="/images/2020/03/07/barteldiagram1961.jpg" caption="Bartels diagram displaying fluctuations in the Earth's magnetic field for the year 1961" >}}

As the pitches were mapped through the Bartel diagram, Dodge focused on working on the rhythm and timbre. The 2920 values were compressed in an 8-minute composition and within those 8 minutes, Dodge used algorithms to organise other aspects of the music: between different points within the data, interpolations were made to create tempo, dynamics, and register:

>In the first half of the piece, there would be accelerando-ritardando patterns; in the second half, a fixed tempo within which two patterns, A and B, would alternate, the A pattern having one note to a beat, and the B pattern 2 to 14 notes to a beat. The B-pattern was derived from the sudden commencements, rises in the values due to solar winds and flares which had a bigger impact on the earth’s magnetic field.

## Electronic music involvement

Besides its importance in sonification, Earth’s Magnetic Field is an important piece in the electro-acoustic music scene as it is the first piece that explicitly uses comb filters to control the timbre. Dodge used the comb filter in the first part while in the second part he used all-pass filtering. The use of filters is a pure aesthetical choice while pitch and rhythm are dependent on the data.

Reference:
[wikipedia](https://en.wikipedia.org/wiki/Charles_Dodge_(composer))
[sonificationart](https://sonificationart.wordpress.com/2017/06/01/earths-magnetic-field-realizations-in-computed-electronic-sound/)
[NASA interview](https://appel.nasa.gov/2016/08/05/nasa-inspires-synergy-between-music-and-science/)
Thieberger, E., & Dodge, C. (1995). An Interview with Charles Dodge. Computer Music Journal, 19(1), 11-24. doi:10.2307/3681298