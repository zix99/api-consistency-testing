# API Consistency Testing (ACT)

API Consistency Testing library provides a set of APIs and interactive terminal questions
so that you can easily describe your application web APIs in a concise manner, and validate
that their responses are predictable and consistent.  Web APIs are defined with a common
contract, and setting up the tests is simply a matter of answering yes-or-no questions.

## API Spec


```json
{
	description : 'Test creating a new pet',
	tags : ['create', 'pet'],
	timeout: 8000,
	tests : [
		{
			petType : 'Cat',
		},
		{
			petType : 'Dog'
		}
	],
	steps : [
		{
			description: 'Create the new pet',
			method : 'POST',
			uri : '{services.pets}/api/v1/pet',
			expect: 200,
			export: 'pet',
			payload : {
				name : 'Fred',
				type: '{petType}'
			}
		},
		{
			description: 'Validate the pet is now gettable',
			method: 'GET',
			expect: 200,
			uri : '{services.invoice}/api/v1/pet/{pet.id}'
		}
	]
}
```

# License

See [license](LICENSE.md).