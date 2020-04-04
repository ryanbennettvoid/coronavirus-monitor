#!/bin/bash
# git subtree push --prefix backend heroku master
git push heroku `git subtree split --prefix backend master`:master --force