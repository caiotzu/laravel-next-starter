export interface ApiErrorResponse {
	errors: {
		business?: string[];
		[field: string]: string[] | undefined;
	};
}
