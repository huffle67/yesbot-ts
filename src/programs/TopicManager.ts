import { Message, TextChannel, MessageAttachment } from "discord.js";
import axios from "axios";

const QUESTION_LINK: string =
  "https://spreadsheets.google.com/feeds/cells/1xUIqCaSrjyQzJeJfnXR0Hix6mDkaFhVauFmJb8Pzkj0/1/public/full?alt=json";
const MAKEUP_CHALLENGE_PICTURE_URL =
  "https://cdn.discordapp.com/attachments/698545400075780147/712491981158481940/image0.png";
const INKTOBER_IMAGE_URL =
  "https://media.discordapp.net/attachments/689589403189772291/761243856946987078/2020promptlist.png";

export default async function TopicManager(message: Message) {
  const channel: TextChannel = <TextChannel>message.channel;

  switch (channel.name) {
    case "philosophy":
      const response = await axios.get(QUESTION_LINK);
      let questions: string[] = [];
      let date = new Date().getDate();

      response.data.feed.entry.forEach((element: any) => {
        questions.push(element.content.$t);
      });

      date--;
      const question = questions[date];
      message.channel.send(question);
      break;

    case "beauty-and-fashion":
      const image = new MessageAttachment(MAKEUP_CHALLENGE_PICTURE_URL);
      message.channel.send(image);
      break;

    case "visual-design":
      message.channel.send(new MessageAttachment(INKTOBER_IMAGE_URL));
      break;

    default:
      break;
  }
}
