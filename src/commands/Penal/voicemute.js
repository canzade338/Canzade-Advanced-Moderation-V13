const Command = require("../../base/Command.js");
const data = require("../../models/cezalar.js");
const ms = require("ms");
const moment = require("moment");
require("moment-duration-format");
const Discord = require("discord.js");
let serverSettings = require("../../models/serverSettings");
const mutes = require("../../models/voicemute.js");
const sunucu = require("../../models/sunucu-bilgi.js");
const wmute = require("../../models/waitMute.js");
class VMute extends Command {
	constructor(client) {
		super(client, {
			name: "vmute",
			usage: ".vmute [@user][süre][sebep]",
			category: "Authorized",
			description: "Belirttiğiniz kişiye voice mute atarsınız.",
			aliases: ["vmute", "voicemute", "voice-mute"],
		});
	}

	async run(message, args, perm) {
		let server = await serverSettings.findOne({
			guildID: message.guild.id,
		});
		if (
			!message.member.roles.cache.some((r) =>
				server.VoiceMuteAuth.includes(r.id),
			) &&
			!message.member.permissions.has("VIEW_AUDIT_LOG")
		)
			return;
		let user =
			message.mentions.members.first() ||
			(await this.client.üye(args[0], message.guild));
		if (!user)
			return this.client.yolla(
				"Susturmak istediğin kullanıcıyı bulamadım.",
				message.author,
				message.channel,
			);
		if (user.id == message.author.id)
			return this.client.yolla(
				"Kullanıcılar kendilerine ceza-i işlem uygulayamaz.",
				message.author,
				message.channel,
			);
		if (!message.member.roles.cache.get(server.GuildOwner)) {
			if (user.permissions.has("MANAGE_ROLES"))
				return this.client.yolla(
					"Yöneticilere ceza-i işlem uygulayamazsın.",
					message.author,
					message.channel,
				);
			if (user.roles.cache.has(server.BotCommandRole))
				return this.client.yolla(
					"Yetkililer birbirlerine ceza işlemi uygulayamazlar.",
					message.author,
					message.channel,
				);
			if (
				message.member.roles.highest.position <=
				message.guild.members.cache.get(user.id).roles.highest.position
			)
				return this.client.yolla(
					"Kendi rolünden yüksek kişilere işlem uygulayamazsın!",
					message.author,
					message.channel,
				);
		}
		if (user.voice.serverMute == true)
			return this.client.yolla(
				"Kullanıcı zaten susturulmuş durumda.",
				message.author,
				message.channel,
			);

		let id = await data.countDocuments().exec();

		const embed = new Discord.MessageEmbed().setColor("RANDOM").setAuthor({
			name: message.author.tag,
			iconURL: message.author.displayAvatarURL({ dynamic: true }),
		}).setDescription(`
${user}, kişisinin uyguladığı davranışlara göre aşağıdaki buttonlardan seçim yaparak voice mute cezası uygulayın.

${Discord.Formatters.codeBlock(
	"css",
	`
1️- Sesteki olayı chat'e yansıtmak / konuyu uzatmak. [15 dakika]
2️- Küfür, Ortam bozma, Troll, Soundpad. [20 dakika]
3- Dizi veya filmler hakkında spoiler vermek. [10 dakika]
4- Tartışmak, kavga etmek veya rahatsızlık çıkarmak, kışkırtmak. [20 dakika]
5- Ailevi küfür. [30 dakika]
6- Siyaset. [20 dakika]
7- Ortamı, (${message.guild.name}) sunucusunu kötülemek. [25 dakika]
8- Taciz, kadın üyelere sarkmak [45 dakika]
`,
)}
`);

		const row = new Discord.MessageActionRow().addComponents(
			new Discord.MessageSelectMenu()
				.setCustomId("voicemutepanel")
				.setPlaceholder("Kullanıcıya vermek istediğiniz cezayı seçin!")
				.addOptions([
					{
						label: `1- Sesteki olayı chat'e yansıtmak / konuyu uzatmak.`,
						description: "15 dakika",
						value: "1",
					},
					{
						label: `2- Küfür, Ortam bozma, Troll, Soundpad.`,
						description: "20 dakika",
						value: "2",
					},
					{
						label: `3- Dizi veya filmler hakkında spoiler vermek.`,
						description: "10 dakika",
						value: "3",
					},
					{
						label: `4- Tartışmak, kavga etmek veya rahatsızlık çıkarmak, kışkırtmak.`,
						description: "20 dakika",
						value: "4",
					},
					{
						label: `5- Ailevi küfür.`,
						description: "30 dakika",
						value: "5",
					},
					{
						label: `6- Siyaset.`,
						description: "20 dakika",
						value: "6",
					},
					{
						label: `7- Ortamı, (${message.guild.name}) sunucusunu kötülemek.`,
						description: "25 dakika",
						value: "7",
					},
					{
						label: `8- Taciz, Kadın üyelere sarkmak.`,
						description: "45 dakika",
						value: "8",
					},
					{
						label: `9- İptal`,
						description: "İşlemi iptal etmek için tıkla.",
						value: "İptal",
					},
				]),
		);

		var msg = await message.channel.send({
			embeds: [embed],
			components: [row],
		});
		var filter = (button) => button.user.id === message.author.id;
		const collector = msg.createMessageComponentCollector({
			filter,
			time: 30000,
		});

		collector.on("collect", async (button) => {
			row.components[0].setDisabled(true);

			msg.edit({ components: [row] });

			if(button.customId === "voicemutepanel") {
				if(button.values[0] === "1") {
			await VMuteceza(user, "Sesteki olayı chat'e yansıtmak / konuyu uzatmak.", 1000 * 60 * 15, button, this.client)
				} else if(button.values[0] === "2") {
			await VMuteceza(user, "Küfür, Ortam bozma, Troll, Soundpad.", 1000 * 60 * 20, button, this.client)		
				} else if(button.values[0] === "3") {
			await VMuteceza(user, "Dizi veya filmler hakkında spoiler vermek.", 1000 * 60 * 10, button, this.client)		
				} else if(button.values[0] === "4") {
			await VMuteceza(user, "Tartışmak, kavga etmek veya rahatsızlık çıkarmak, kışkırtmak.", 1000 * 60 * 20, button, this.client)			
				} else if(button.values[0] === "5") {
			await VMuteceza(user, "Ailevi küfür.", 1000 * 60 * 30, button, this.client)			
				} else if(button.values[0] === "6") {
			await VMuteceza(user, "Siyaset.", 1000 * 60 * 20, button, this.client)			
				} else if(button.values[0] === "7") {
			await VMuteceza(user, `Ortamı, (${message.guild.name}) sunucusunu kötülemek.`, 1000 * 60 * 25, button, this.client)			
				} else if(button.values[0] === "8") {
			await VMuteceza(user, "Taciz, Kadın üyelere sarkmak.", 1000 * 60 * 45, button, this.client)			
				} else if(button.values[0] === "İptal") {
			button.reply("İşlem iptal edildi.")
				}
			}
		})

		async function VMuteceza(user, sebep, time, button, client) {
			let şuanki = Date.parse(new Date());
			let cıkaralım = time + Date.parse(new Date());
					if (user.voice.channel) {
						user.voice.setMute(true);
						await button.reply(
							`${client.emojis.cache.find(
								(x) =>
									x.name ===
									client.config.emojis.mute_name,
							)} <@${user.id}> ${await client.turkishDate(
								time,
							)} boyunca **${sebep}** sebebiyle ses kanallarında susturuldu. (Ceza Numarası: \`#${
								id + 1
							}\`)`,
						);
						const mutelendi = new Discord.MessageEmbed()
							.setAuthor({
								name: message.author.tag,
								iconURL: message.author.displayAvatarURL({
									dynamic: true,
								}),
							})
							.setColor("32CD32")
							.setFooter({ text: `Ceza Numarası: #${id + 1}` })
							.setDescription(`
${user} (\`${user.user.tag}\` - \`${
							user.id
						}\`) kişisi ${await client.turkishDate(
							time,
						)} boyunca ses kanallarında susturuldu

• Ses Mute atılma tarihi: <t:${Math.floor(şuanki / 1000)}>
• Ses Mute bitiş tarihi: <t:${Math.floor(cıkaralım / 1000)}> (<t:${Math.floor(
							cıkaralım / 1000,
						)}:R>)
• Ses Mute sebebi: ${sebep}
`);
						await client.channels.cache
							.get(server.PenaltyPointLog)
							.send(
								`${user}; adlı üye aldığınız **#${
									id + 1
								}** ID'li ceza ile **${
									(await client.punishPoint(user.id)) +
									10
								}** ulaştınız.`,
							)
							.catch((e) => {});
						await client.channels.cache
							.get(server.VoiceMuteLog)
							.send({ embeds: [mutelendi] });
						await mutes.findOne(
							{ user: user.id },
							async (err, doc) => {
								const newMute = new mutes({
									user: user.id,
									muted: true,
									yetkili: message.author.id,
									endDate: Date.now() + time,
									start: Date.now(),
									sebep: sebep,
								});
								newMute.save().catch((e) => console.log(e));
							},
						);
						await data
							.find({})
							.sort({ ihlal: "descending" })
							.exec(async (err, res) => {
								const newData = new data({
									user: user.id,
									yetkili: message.author.id,
									ihlal: id + 1,
									ceza: "Voice Mute",
									sebep: sebep,
									type: button.values[0],
									tarih: moment(
										Date.parse(new Date()),
									).format("LLL"),
									bitiş: moment(
										Date.parse(new Date()) + time,
									).format("LLL"),
								});
								newData.save().catch((e) => console.error(e));
							});
					} else {
						await wmute.findOne(
							{ user: user.id },
							async (err, res) => {
								if (!res) {
									await button.reply(
										`${client.emojis.cache.find(
											(x) =>
												x.name ===
												client.config.emojis
													.no_name,
										)} <@${
											user.id
										}> kişisinin ${await client.turkishDate(
											time,
										)} sürelik (**${sebep}**) ses mutesi başlatılamadı kullanıcı sese bağlanınca otomatik olarak cezası başlayacak. (Ceza Numarası: \`#${
											id + 1
										}\`)`,
									);
									const newWmute = new wmute({
										user: user.id,
										muted: true,
										yetkili: message.author.id,
										sebep: sebep,
										date: time,
										cezano: id + 1,
									});
									newWmute
										.save()
										.catch((e) => console.log(e));
								} else {
									return button.reply(
										`${client.emojis.cache.find(
											(x) =>
												x.name ===
												client.config.emojis
													.no_name,
										)} <@${
											user.id
										}> kişisinin veritabanında halihazırda başlayacak bir cezası mevcut.`,
									);
								}
							},
						);
					
				}
		}


		collector.on("end", async (button) => {
			msg.delete();
		});
	}
}

module.exports = VMute;
