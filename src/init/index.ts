#!/usr/bin/env node

// eslint-disable-next-line import/no-extraneous-dependencies
import { readFileSync, rmSync, writeFileSync } from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import chalk from 'chalk';
// eslint-disable-next-line import/no-extraneous-dependencies
import inquirer from 'inquirer';
// eslint-disable-next-line import/no-extraneous-dependencies
import validate from 'validate-npm-package-name';

type Answers = {
    package: { name: string; description: string; author: string; keywords: string };
    githubPath: string;
    codeClimate: boolean;
};

const invalid = (message: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${chalk.red(message)}`);
};

inquirer
    .prompt<Answers>([
        {
            type: 'input',
            name: 'package.name',
            message: 'What is the package name (i.e. @bed-and-breakfast/package)',
            validate: (input) => {
                const valid = validate(input).validForNewPackages;

                if (!valid) {
                    invalid('Invalid package name');
                }

                return valid;
            },
        },
        {
            type: 'input',
            name: 'package.description',
            message: 'What is the package description (i.e. Bed & Breakfast Package)',
            validate: (input) => {
                const valid = input.length >= 5;

                if (!valid) {
                    invalid('Package description is too short');
                }

                return valid;
            },
        },
        {
            type: 'input',
            name: 'package.author',
            message: 'What is the package author (i.e. Bed & Breakfast)',
            default: 'Bed & Breakfast',
            validate: (input) => {
                const valid = input.length >= 1;

                if (!valid) {
                    invalid('Invalid package author');
                }

                return valid;
            },
        },
        {
            type: 'input',
            name: 'package.keywords',
            message: 'Package keywords (i.e. npm,package,...)',
            validate: (input) => {
                let valid = false;

                const keywords = input.split(',');

                valid =
                    input.length >= 3 &&
                    keywords.length === keywords.filter((keyword: string) => keyword.length > 0).length;

                if (!valid) {
                    invalid('Invalid package keywords');
                }

                return valid;
            },
        },
        {
            type: 'input',
            name: 'githubPath',
            message: 'What is the github url path (https://github.com/<PATH>, i.e. bed-and-breakfast/package)',
            default: (answers: Answers) =>
                answers.package.name.indexOf('@') === 0 ? answers.package.name.substring(1) : answers.package.name,
            validate: (input) => {
                const valid = input.length >= 1 && input.indexOf('/') > 0;

                if (!valid) {
                    invalid('Invalid github url path');
                }

                return valid;
            },
        },
        {
            type: 'confirm',
            name: 'codeClimate',
            message: 'Would you like to use Code Climate',
            default: true,
        },
    ])
    .then((answers) => {
        let packageJson = JSON.parse(readFileSync('package.json').toString());

        packageJson = {
            ...packageJson,
            ...answers.package,
            keywords: answers.package.keywords.split(',').map((keyword) => keyword.trim()),
            version: '0.0.0',
            homepage: `https://github.com/${answers.githubPath}`,
            bugs: `https://github.com/${answers.githubPath}/issues`,
            repository: { url: `https://github.com/${answers.githubPath}.git` },
        };

        writeFileSync('package.json', JSON.stringify(packageJson));

        // prettier-ignore
        writeFileSync('README.md', `# ${answers.package.description}\n +
            \n
            [![NPM Version](https://img.shields.io/npm/v/${answers.package.name})](https://www.npmjs.com/package/${answers.package.name})\n
            [![CI](https://github.com/${answers.githubPath}/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/${answers.githubPath}/actions/workflows/ci.yml)\n
            [![Release](https://github.com/${answers.githubPath}/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/${answers.githubPath}/actions/workflows/release.yml)\n
            ${answers.codeClimate ? `[![Code Climate](https://codeclimate.com/github/${answers.githubPath}/badges/gpa.svg)](https://codeclimate.com/github/${answers.githubPath})\n
            [![Code Coverage](https://codeclimate.com/github/${answers.githubPath}/badges/coverage.svg)](https://codeclimate.com/github/${answers.githubPath})\n` : ''}
            [![Known Vulnerabilities](https://snyk.io/test/github/${answers.githubPath}/badge.svg?targetFile=package.json)](https://snyk.io/test/github/${answers.githubPath}?targetFile=package.json)`)

        rmSync('CHANGELOG.md');
    });