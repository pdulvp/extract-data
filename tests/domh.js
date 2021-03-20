var domh = {
	mockItem: () => {
		return {
			getAttribute: function (string) {
				return this[string];
			},
			setAttribute: function (string, value) {
				return this[string] = value;
			}
		}
	}
};

module.exports = domh;