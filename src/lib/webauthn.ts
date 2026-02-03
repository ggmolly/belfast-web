type PublicKeyCredentialDescriptorJSON = {
	id: string
	type: PublicKeyCredentialType
	transports?: AuthenticatorTransport[]
}

type PublicKeyCredentialUserEntityJSON = Omit<PublicKeyCredentialUserEntity, 'id'> & {
	id: string
}

type PublicKeyCredentialCreationOptionsJSON = {
	challenge: string
	rp: PublicKeyCredentialRpEntity
	user: PublicKeyCredentialUserEntityJSON
	pubKeyCredParams: PublicKeyCredentialParameters[]
	timeout?: number
	attestation?: AttestationConveyancePreference
	excludeCredentials?: PublicKeyCredentialDescriptorJSON[]
	authenticatorSelection?: AuthenticatorSelectionCriteria
	extensions?: AuthenticationExtensionsClientInputs
}

type PublicKeyCredentialRequestOptionsJSON = {
	challenge: string
	timeout?: number
	rpId?: string
	allowCredentials?: PublicKeyCredentialDescriptorJSON[]
	userVerification?: UserVerificationRequirement
	extensions?: AuthenticationExtensionsClientInputs
}

export const base64UrlToBuffer = (value: string) => {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
	const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
	const binary = window.atob(padded)
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i += 1) {
		bytes[i] = binary.charCodeAt(i)
	}
	return bytes.buffer
}

export const bufferToBase64Url = (buffer: ArrayBuffer) => {
	const bytes = new Uint8Array(buffer)
	let binary = ''
	for (const byte of bytes) {
		binary += String.fromCharCode(byte)
	}
	return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export const parseCreationOptions = (options: Record<string, unknown>) => {
	const parsed = options as PublicKeyCredentialCreationOptionsJSON
	return {
		...parsed,
		challenge: base64UrlToBuffer(parsed.challenge),
		user: {
			...parsed.user,
			id: base64UrlToBuffer(parsed.user.id),
		},
		excludeCredentials: parsed.excludeCredentials?.map((credential) => ({
			...credential,
			id: base64UrlToBuffer(credential.id),
		})),
	} as PublicKeyCredentialCreationOptions
}

export const parseRequestOptions = (options: Record<string, unknown>) => {
	const parsed = options as PublicKeyCredentialRequestOptionsJSON
	return {
		...parsed,
		challenge: base64UrlToBuffer(parsed.challenge),
		allowCredentials: parsed.allowCredentials?.map((credential) => ({
			...credential,
			id: base64UrlToBuffer(credential.id),
		})),
	} as PublicKeyCredentialRequestOptions
}

export const serializeRegistrationCredential = (credential: PublicKeyCredential) => {
	const response = credential.response as AuthenticatorAttestationResponse
	return {
		id: credential.id,
		rawId: bufferToBase64Url(credential.rawId),
		type: credential.type,
		response: {
			clientDataJSON: bufferToBase64Url(response.clientDataJSON),
			attestationObject: bufferToBase64Url(response.attestationObject),
		},
	}
}

export const serializeAuthenticationCredential = (credential: PublicKeyCredential) => {
	const response = credential.response as AuthenticatorAssertionResponse
	return {
		id: credential.id,
		rawId: bufferToBase64Url(credential.rawId),
		type: credential.type,
		response: {
			clientDataJSON: bufferToBase64Url(response.clientDataJSON),
			authenticatorData: bufferToBase64Url(response.authenticatorData),
			signature: bufferToBase64Url(response.signature),
			userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : undefined,
		},
	}
}
