#!/bin/bash

mkdir thumbnail

find . -type f -exec cp {} ./thumbnail \;

sips -Z 1200 thumbnail/*

exit 0;
