const { FusesPlugin } = require('@electron-forge/plugin-fuses')
const { FuseV1Options, FuseVersion } = require('@electron/fuses')

module.exports = {
	packagerConfig: {
		asar: true,
		name: 'npchatbot',
		icon: './client/public/favicon.ico',
		arch: 'x64',
		platform: 'win32',
		dir: './',
		out: './dist',
		ignore: ['^\\/public$', '^\\/src$'],
	},
	rebuildConfig: {},
	makers: [
		{
			name: '@electron-forge/maker-squirrel',
			platforms: ['win32'],
			config: {
				authors: 'Marcus McBride',
				description: 'A chatbot for Serato & Twitch',
				name: 'npchatbot', // Application name for Squirrel.Windows
				exe: 'npchatbot.exe', // Executable name of the installed app
				setupExe: 'npchatbot-setup.exe', // Name of the setup executable
				setupIcon: './client/public/favicon.ico', // Path to your icon file (must be in .ico format for Windows)
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
