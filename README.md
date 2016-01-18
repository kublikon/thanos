Thanos
================

### About
Project deployment tool for Nodejs and AWS.


### Requirements
* `nodejs` - `v4.2.1` or higher
* `npm` - `v2.14.7` or higher
* `mongodb` - `v2.6.5` or higher
* `AWS account` with Amazon

#### Optional
* `GitHub account` for deployment directly from GitHub


### General Local/Server Setup
The easiest way to setup Thanos is from [npm](https://www.npmjs.com/package/thanos) with `npm install -g thanos` command. You can then run `thanos -st` command to configure the project and install all required dependencies including 
a default user for Thanos.

* `npm install -g thanos`
* `thanos -st`


> Please have your nodejs, mongodb installed and running.


### Development Setup
For development we recommend that Thanos is not installed in a global space. To do this first clone the repo: `git clone https://github.com/kublikon/thanos.git` and then run the `npm install` command in the project space. Once
Thanos is installed you can configure the default user by running `thanos -st -u` command from any terminal location.

* `git clone https://github.com/kublikon/thanos.git`
* `npm install`
* `thanos -st -u`


> Please have your nodejs, mongodb installed and running.


#### Configuration
To configure Thanos run `thanos -st` command in your terminal. You will be prompted for the following information:

* path to mongodb - including any credentials (ex: mongodb://localhost/thanos - for thanos data storage)
* random letter/number combination for salt - for encrypting sensitive information
* AWS account id
* AWS access key id
* AWS secret access key
* AWS bucket
* AWS region
* AWS domain

For more information check out the [wiki](https://github.com/kublikon/thanos/wiki).
