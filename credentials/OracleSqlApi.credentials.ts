import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class OracleSqlApi implements ICredentialType {
	name = 'oracleSqlApi';

	displayName = 'Oracle SQL API';

	properties: INodeProperties[] = [
		{
			displayName: 'User',
			name: 'user',
			type: 'string',
			default: 'hr',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'Connect string',
			name: 'connectString',
			type: 'string',
			default: 'localhost/XEPDB1',
		},
	];
}
