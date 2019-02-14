#!/bin/make -f
# -*- makefile -*-
# SPDX-License-Identifier: MPL-2.0
#{
# Copyright 2018-present Samsung Electronics France SAS, and other contributors
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.*
#}

default: all
	sync

project?=webthings-webapp
url?=file://${CURDIR}/
upstream_url?=https://github.com/samsunginternet/${project}

all: rule/branches help
	sync

help: README.md
	cat README.md

branches+=base/master
branches+=tizen/master
branches+=aframe/master
branches+=sandbox/rzr/pwa/master


%:
	mkdir -p "$@"
	git clone -b "$@" "${upstream_url}" "$@"
	cd "$@" && git remote add local ${url}

rule/branches: ${branches}
	ls $<
