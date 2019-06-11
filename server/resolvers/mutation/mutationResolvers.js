module.exports = {
  Mutation: {
		async placeholder(parent, { input }, { dataSources }){
			return await dataSources.database.mutationPlaceholder('placeholder')
		},

		async placeholderApi(parent, { input }, { dataSources }){
			return await dataSources.placeholderApi.mutationPlaceholder('placeholder')
		},

		async signup(parent, { input }, { dataSources }) {
			return await dataSources.userDatabase.signup(input)
		}
  },
}



