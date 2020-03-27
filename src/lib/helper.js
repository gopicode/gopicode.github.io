export function pick(source, ...keys) {
	return keys.reduce((obj, key) => {
		obj[key] = source[key];
		return obj;
	}, {});
}

export function isEqual(a, b) {
	if (a === b) return true;
	if (!a || !b) return false;
}
