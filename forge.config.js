const { FusesPlugin } = require('@electron-forge/plugin-fuses')
const { FuseV1Options, FuseVersion } = require('@electron/fuses')

module.exports = {
	packagerConfig: {
		asar: {
			unpack: '**/users.db',
		},
		name: 'npchatbot',
		icon: './client/public/favicon/favicon.ico',
		arch: 'x64',
		platform: 'win32',
		dir: './',
		out: './dist',
	},
	rebuildConfig: {},
	makers: [
		{
			name: '@electron-forge/maker-squirrel',
			platforms: ['win32'],
			config: {
				authors: 'Marcus McBride',
				description: 'Interactive Music Commmands for Twitch & Serato',
				name: 'npchatbot',
				exe: 'npchatbot.exe',
				setupExe: 'npchatbot-setup.exe',
				setupIcon: './client/public/favicon/favicon.ico',
				loadingGif: './client/public/spinner.gif',
			},
		},
		{
			name: '@electron-forge/maker-zip',
			platforms: ['darwin'],
		},
		{
			name: '@electron-forge/maker-deb',
			config: {},
		},
		{
			name: '@electron-forge/maker-rpm',
			config: {},
		},
		{
			name: '@electron-forge/maker-dmg',
			platforms: ['darwin'],
			config: {
				name: 'npchatbot',
				icon: './client/public/favicon/favicon.icns',
				background: './client/public/dmg-background.png',
				overwrite: true,
				format: 'ULFO',
			},
		},
	],
	plugins: [
		{
			name: '@electron-forge/plugin-auto-unpack-natives',
			config: {},
		},
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
}
