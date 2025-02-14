# Is This Phishy

## To install dependencies:

```
nvm use 22
npm install
```

## To run the entire test suite (requires AWS credentials):

```
npm test
```

## Contributing

When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before making a change.

Please note we have a code of conduct, please follow it in all your interactions with the project.

### Pull Request Process

1. Ensure tests are passing. To run the main algorithm test suite (doesn't require AWS credentials):
```
npm test -- -t 'testsNotRequiringAWSCredentials'
```
2. Update the README.md with details of changes to the interface, this includes new environment
   variables, exposed ports, useful file locations and container parameters.
3. You may merge the Pull Request in once you have the sign-off of one other developer, or if you
   do not have permission to do that, you may request the second reviewer to merge it for you.

## License

Is This Phishy is released under the [MIT License](https://opensource.org/licenses/MIT).
