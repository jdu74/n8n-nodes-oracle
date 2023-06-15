import {
	deepCopy,
	ICredentialDataDecryptedObject,
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
} from 'n8n-workflow';

import oracledb from 'oracledb';

/**
 * Returns of copy of the items which only contains the json data and
 * of that only the define properties
 *
 * @param {INodeExecutionData[]} items The items to copy
 * @param {string[]} properties The properties it should include
 */
export function copyInputItems(items: INodeExecutionData[], properties: string[]): IDataObject[] {
	// Prepare the data to insert and copy it to be returned
	let newItem: IDataObject;
	return items.map((item) => {
		newItem = {};
		for (const property of properties) {
			if (item.json[property] === undefined) {
				newItem[property] = null;
			} else {
				newItem[property] = deepCopy(item.json[property]);
			}
		}
		return newItem;
	});
}

export async function createConnection(
	credentials: ICredentialDataDecryptedObject,
): Promise<any> {
/*	const { ssl, caCertificate, clientCertificate, clientPrivateKey, ...baseCredentials } =
		credentials;

	if (ssl) {
		baseCredentials.ssl = {};

		if (caCertificate) {
			baseCredentials.ssl.ca = caCertificate;
		}

		if (clientCertificate || clientPrivateKey) {
			baseCredentials.ssl.cert = clientCertificate;
			baseCredentials.ssl.key = clientPrivateKey;
		}
	}
*/
	return oracledb.getConnection(credentials);
}

export async function searchTables(
	this: ILoadOptionsFunctions,
	query?: string,
): Promise<INodeListSearchResult> {
	const credentials = await this.getCredentials('oracleSqlApi');
	const connection = await createConnection(credentials);
	const sql = `
	select table_name from user_tables
	`;
	const result = await connection.execute(sql, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
	const results = (result.rows as IDataObject[]).map((r) => ({
		name: r.TABLE_NAME as string,
		value: r.TABLE_NAME as string,
	}));
	await connection.close();
	return { results };
}
