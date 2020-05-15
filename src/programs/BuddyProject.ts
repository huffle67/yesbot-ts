import { db } from "..";
import bot from "../index";
import { GuildMember, PartialGuildMember, Client, TextChannel } from "discord.js";
import {
  BuddyProjectEntryRepository,
  BuddyProjectEntry,
} from "../entities/BuddyProjectEntry";
import { Repository } from "typeorm";
import { BUDDY_PROJECT_MATCHING } from '../const';

const updateDatabaseWithQuery = (
  BuddyEntryRepo: Repository<BuddyProjectEntry>,
  memberId: string,
  buddyId: string,
  BuddyEntry: BuddyProjectEntry
) => {
  BuddyEntryRepo.createQueryBuilder()
    .update(BuddyEntry)
    .set({ matched: true, buddy_id: buddyId })
    .where("user_id = :member_id", { member_id: memberId })
    .execute()
    .catch((err) =>
      console.log("There was an error updating member entry: ", err)
    );
  BuddyEntryRepo.createQueryBuilder()
    .update(BuddyEntry)
    .set({ matched: true, buddy_id: memberId })
    .where("user_id = :member_id", { member_id: buddyId })
    .execute()
    .catch((err) =>
      console.log("There was an error updating buddy entry: ", err)
    );
};

export async function BuddyProjectSignup(
  member: GuildMember | PartialGuildMember
): Promise<null> {
  const discord_user =
    new Date(member.joinedAt.toDateString()) <
    new Date(new Date().toDateString());
  const dmChannel = await member.createDM();
  const buddyEntries = await BuddyProjectEntryRepository();
  const hasEntered = await buddyEntries.findOne(member.id);
  const planningChannel = member.guild.channels.cache.find(c => c.name == "planning") as TextChannel;

  if (hasEntered) {
    dmChannel.send(
      hasEntered.matched
        ? `It looks like I already found you a match! Did <@${hasEntered.buddy_id}> stopped replying? :grin:`
        : "Hey there, it looks like you just tried to sign up to the Buddy Project again, no need to do that, you're already registered!"
    );
  } else {
    const BuddyEntry = new BuddyProjectEntry();
    const newBuddy = buddyEntries.create({
      user_id: member.id,
      matched: false,
      discord_user: discord_user,
    });
    await buddyEntries.save(newBuddy);

    const successMessage =
      "Woo! You just signed up to the buddy project, exciting right? I'll message you again momentarily with your buddy and what you need to do next!";
    dmChannel.send(successMessage);

    if (BUDDY_PROJECT_MATCHING) {
      // Find matches of the opposite group (aka newsletter group if user is of discord group)
      const potentialMatches = await buddyEntries.find({
        where: { discord_user: !discord_user, matched: false },
      });
      if (potentialMatches.length > 0) {
        try {
          const finalMatch = potentialMatches[0];
          updateDatabaseWithQuery(
            buddyEntries,
            member.id,
            finalMatch.user_id,
            BuddyEntry
          );

          const buddyDmClient = await bot.users.fetch(finalMatch.user_id);
          // buddyDmClient.send(`Here is your match: <@${member.id}>`);
          // dmChannel.send(`Here is your match: <@${finalMatch.user_id}> !`);
          planningChannel.send(`<@${member.id}> is being matched with <@${finalMatch.user_id}>.`);
          return;
        } catch (err) {
          console.log(
            "There was an error finding matches for opposite group: ",
            err
          );
        }
      }

      try {
        // If the opposite group didn't have any matches, find one from own group
        const finalMatch = await buddyEntries.findOne({
          where: { discord_user: discord_user, matched: false },
        });
        updateDatabaseWithQuery(
          buddyEntries,
          member.id,
          finalMatch.user_id,
          BuddyEntry
        );

          // buddyDmClient.send(`Here is your match: <@${member.id}>`);
          // dmChannel.send(`Here is your match: <@${finalMatch.user_id}> !`);
          planningChannel.send(`<@${member.id}> is being matched with <@${finalMatch.user_id}>.`);
      } catch (err) {
        console.log("There was an error finding discord user group: ", err);
      }
    }
  }

  return null;
}
