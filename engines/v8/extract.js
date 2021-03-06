// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the “License”);
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// <https://apache.org/licenses/LICENSE-2.0>.
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an “AS IS” BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const path = require('path');

const execa = require('execa');

const { Installer } = require('../../shared/installer.js');
const unzip = require('../../shared/unzip.js');

const extract = ({ filePath, engine, os }) => {
	return new Promise(async (resolve, reject) => {
		const tmpPath = path.dirname(filePath);
		await unzip({
			from: filePath,
			to: tmpPath,
		});
		const installer = new Installer({
			engine,
			path: tmpPath,
		});
		installer.installLibrary('icudtl.dat');
		installer.installLibrary('natives_blob.bin');
		installer.installLibrary('snapshot_blob.bin');
		if (os.startsWith('win')) {
			installer.installBinary(
				{ 'd8.exe': 'v8.exe' },
				{ symlink: false }
			);
			installer.installScript({
				name: 'v8.cmd',
				generateScript: (targetPath) => {
					return `
						@echo off
						"${targetPath}\\v8.exe" --natives_blob="${targetPath}\\natives_blob.bin" --snapshot_blob="${targetPath}\\snapshot_blob.bin" %*
					`;
				}
			});
		} else {
			installer.installBinary({ 'd8': 'v8' }, { symlink: false });
			installer.installScript({
				name: 'v8',
				generateScript: (targetPath) => {
					return `
						#!/usr/bin/env bash
						"${targetPath}/v8" --natives_blob="${targetPath}/natives_blob.bin" --snapshot_blob="${targetPath}/snapshot_blob.bin" "$@"
					`;
				}
			});
		}
		resolve();
	});
};

module.exports = extract;
