import {
	ICredentialDataDecryptedObject,
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IDataObject,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import oracledb, { Connection, Result } from 'oracledb';

import { copyInputItems, createConnection, searchTables } from './GenericFunctions';
import { IExecuteFunctions } from 'n8n-core';

export class OracleSql implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Oracle SQL',
		name: 'oracleSql',
		icon: 'file:oraclesql.svg',
		group: ['input'],
		version: 1,
		description: 'Get, add and update data in Oracle Database',
		defaults: {
			name: 'OracleSql',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'oracleSqlApi',
				required: true,
				testedBy: 'oracleConnectionTest',
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Execute Query',
						value: 'executeQuery',
						description: 'Execute an SQL query',
						action: 'Execute a SQL query',
					},
					{
						name: 'Insert',
						value: 'insert',
						description: 'Insert rows in database',
						action: 'Insert rows in database',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update rows in database',
						action: 'Update rows in database',
					},
                    {
                        name: 'Execute Stored Procedure',
                        displayName: 'Execute Stored Procedure',
                        value: 'executeStoredProcedure',
                        description: 'Execute a stored procedure',
                        action: 'Execute a stored procedure',
                    }
				],
				default: 'insert',
			},

			// ----------------------------------
			//         executeQuery
			// ----------------------------------
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['executeQuery'],
					},
				},
				default: '',
				placeholder: 'SELECT id, name FROM product WHERE id < 40',
				required: true,
				description: 'The SQL query to execute',
			},

			// ----------------------------------
			//         executeSP
			// ----------------------------------
			{
				displayName: 'Stored Procedure',
				name: 'storedProcedure',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['executeStoredProcedure'],
					},
				},
				default: '',
				placeholder: 'get_customer_details',
				required: true,
				description: 'The SQL query to execute',
			},
            {
                displayName: 'Procedure Parameters',
                name: 'procedureParameters',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true,
                },
                displayOptions: {
                    show: {
                        operation: ['executeStoredProcedure'],
                    },
                },
                placeholder: 'Add Parameter',
                default: {},
                options: [
                    {
                        name: 'in',
                        displayName: 'In',
                        values: [
                            {
                                displayName: 'Name',
                                name: 'name',
                                type: 'string',
                                default: '',
                                description: 'Name of the input parameter.',
                            },
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                default: '',
                                description: 'Value of the input parameter.',
                            },
                        ],
                    },
                    {
                        name: 'out',
                        displayName: 'Out',
                        values: [
                            {
                                displayName: 'Name',
                                name: 'name',
                                type: 'string',
                                default: '',
                                description: 'Name of the output parameter.',
                            },
                        ],
                    },
                ],
            },

			// ----------------------------------
			//         insert
			// ----------------------------------
			{
				displayName: 'Table',
				name: 'table',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select a Table...',
						typeOptions: {
							searchListMethod: 'searchTables',
							searchFilterRequired: false,
							searchable: true,
						},
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						placeholder: 'table_name',
					},
				],
				displayOptions: {
					show: {
						operation: ['insert'],
					},
				},
				description: 'Name of the table in which to insert data to',
			},
			{
				displayName: 'Columns',
				name: 'columns',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['insert'],
					},
				},
				default: '',
				placeholder: 'id,name,description',
				description:
					'Comma-separated list of the properties which should used as columns for the new rows',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				displayOptions: {
					show: {
						operation: ['insert'],
					},
				},
				default: {},
				placeholder: 'Add modifiers',
				description: 'Modifiers for INSERT statement',
				options: [
					{
						displayName: 'Ignore',
						name: 'ignore',
						type: 'boolean',
						default: true,
						description:
							'Whether to ignore any ignorable errors that occur while executing the INSERT statement',
					},
					{
						displayName: 'Priority',
						name: 'priority',
						type: 'options',
						options: [
							{
								name: 'Low Prioirity',
								value: 'LOW_PRIORITY',
								description:
									'Delays execution of the INSERT until no other clients are reading from the table',
							},
							{
								name: 'High Priority',
								value: 'HIGH_PRIORITY',
								description:
									'Overrides the effect of the --low-priority-updates option if the server was started with that option. It also causes concurrent inserts not to be used.',
							},
						],
						default: 'LOW_PRIORITY',
						description:
							'Ignore any ignorable errors that occur while executing the INSERT statement',
					},
				],
			},

			// ----------------------------------
			//         update
			// ----------------------------------
			{
				displayName: 'Table',
				name: 'table',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select a Table...',
						typeOptions: {
							searchListMethod: 'searchTables',
							searchFilterRequired: false,
							searchable: true,
						},
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						placeholder: 'table_name',
					},
				],
				displayOptions: {
					show: {
						operation: ['update'],
					},
				},
				description: 'Name of the table in which to update data in',
			},
			{
				displayName: 'Update Key',
				name: 'updateKey',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['update'],
					},
				},
				default: 'id',
				required: true,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-id
				description:
					'Name of the property which decides which rows in the database should be updated. Normally that would be "id".',
			},
			{
				displayName: 'Columns',
				name: 'columns',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['update'],
					},
				},
				default: '',
				placeholder: 'name,description',
				description:
					'Comma-separated list of the properties which should used as columns for rows to update',
			},
		],
	};

	methods = {
		credentialTest: {
			async oracleConnectionTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data as ICredentialDataDecryptedObject;
				try {
					const connection: Connection = await createConnection(credentials);
					await connection.close();
				} catch (error) {
					return {
						status: 'Error',
						message: error.message,
					};
				}
				return {
					status: 'OK',
					message: 'Connection successful!',
				};
			},
		},
		listSearch: {
			searchTables,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('oracleSqlApi');
		const connection = await createConnection(credentials);
		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0);
		let returnItems: INodeExecutionData[] = [];

		if (operation === 'executeQuery') {
			// ----------------------------------
			//         executeQuery
			// ----------------------------------

			try {
				const queryQueue = items.map(async (item, index) => {
					const rawQuery = this.getNodeParameter('query', index) as string;
					const binds = {};
					const options = {
						outFormat: oracledb.OUT_FORMAT_OBJECT,   // query result format
					};
					return connection.execute(rawQuery, binds, options);
				});

				returnItems = ((await Promise.all(queryQueue))).reduce(
					(collection, result, index) => {
						const rows = result.rows;
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(rows as unknown as IDataObject[]),
							{ itemData: { item: index } },
						);

						collection.push(...executionData);

						return collection;
					},
					[] as INodeExecutionData[],
				);
			} catch (error) {
				if (this.continueOnFail()) {
					returnItems = this.helpers.returnJsonArray({ error: error.message });
				} else {
					await connection.close();
					throw error;
				}
			}
        } else if (operation === 'executeStoredProcedure') {
			// ----------------------------------
			//         executeStoredProcedure
			// ----------------------------------
            try {
                const storedProcedure = this.getNodeParameter('storedProcedure', 0) as string;
                const procedureParameters = this.getNodeParameter('procedureParameters', 0) as any;

                // Prepare input and output parameter lists
                const inParams = procedureParameters.in || [];
                const outParams = procedureParameters.out || [];

                // Prepare the SQL call statement
                let callStatement = `BEGIN ${storedProcedure}(`;
                callStatement += [...inParams.map((param: any) => `:${param.name}`), ...outParams.map((param: any) => `:${param.name}`)].join(', ');
                callStatement += '); END;';

                // Prepare the bind variable object
                let bindVars: any = {};
                inParams.forEach((param: any, i: number) => {
                    bindVars[param.name] = param.value;
                });
                outParams.forEach((param: any) => {
                    bindVars[param.name] = { dir: oracledb.BIND_OUT };
                });

                // Execute the stored procedure
                const result = await connection.execute(callStatement, bindVars);

                // Prepare the output data
                let outputData: IDataObject = {};
                outParams.forEach((param: any) => {
                    outputData[param.name] = result.outBinds[param.name];
                });

                returnItems = this.helpers.returnJsonArray([outputData]);
            } catch (error) {
                if (this.continueOnFail()) {
                    returnItems = this.helpers.returnJsonArray({ error: error.message });
                } else {
                    await connection.close();
                    throw error;
                }
            }
		} else if (operation === 'insert') {
			// ----------------------------------
			//         insert
			// ----------------------------------

			try {
				const table = this.getNodeParameter('table', 0, '', { extractValue: true }) as string;
				const columnString = this.getNodeParameter('columns', 0) as string;
				const columns = columnString.split(',').map((column) => column.trim());
				const insertItems = copyInputItems(items, columns);
				const insertPlaceholder = `(${columns.map((_column) => '?').join(',')})`;
				const options = this.getNodeParameter('options', 0);
				const insertIgnore = options.ignore as boolean;
				const insertPriority = options.priority as string;

				const insertSQL = `INSERT ${insertPriority || ''} ${
					insertIgnore ? 'IGNORE' : ''
				} INTO ${table}(${columnString}) VALUES ${items
					.map((_item) => insertPlaceholder)
					.join(',')};`;
				const queryItems = insertItems.reduce(
					(collection, item) => collection.concat(Object.values(item as any)),
					[],
				);

				const queryResult = await connection.query(insertSQL, queryItems);

				returnItems = this.helpers.returnJsonArray(queryResult[0] as unknown as IDataObject);
			} catch (error) {
				if (this.continueOnFail()) {
					returnItems = this.helpers.returnJsonArray({ error: error.message });
				} else {
					await connection.close();
					throw error;
				}
			}
		} else if (operation === 'update') {
			// ----------------------------------
			//         update
			// ----------------------------------

			try {
				const table = this.getNodeParameter('table', 0, '', { extractValue: true }) as string;
				const updateKey = this.getNodeParameter('updateKey', 0) as string;
				const columnString = this.getNodeParameter('columns', 0) as string;
				const columns = columnString.split(',').map((column) => column.trim());

				if (!columns.includes(updateKey)) {
					columns.unshift(updateKey);
				}

				const updateItems = copyInputItems(items, columns);
				const updateSQL = `UPDATE ${table} SET ${columns
					.map((column) => `${column} = ?`)
					.join(',')} WHERE ${updateKey} = ?;`;
				const queryQueue = updateItems.map(async (item) =>
					connection.query(updateSQL, Object.values(item).concat(item[updateKey])),
				);
				const queryResult = await Promise.all(queryQueue);
				returnItems = this.helpers.returnJsonArray(
					queryResult.map((result) => result[0]) as unknown as IDataObject[],
				);
			} catch (error) {
				if (this.continueOnFail()) {
					returnItems = this.helpers.returnJsonArray({ error: error.message });
				} else {
					await connection.close();
					throw error;
				}
			}
		} else {
			if (this.continueOnFail()) {
				returnItems = this.helpers.returnJsonArray({
					error: `The operation "${operation}" is not supported!`,
				});
			} else {
				await connection.close();
				throw new NodeOperationError(
					this.getNode(),
					`The operation "${operation}" is not supported!`,
				);
			}
		}

		await connection.close();

		return this.prepareOutputData(returnItems);
	}
}
