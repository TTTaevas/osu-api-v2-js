import { API, Ruleset, User } from "../index.js";

export interface Team {
  flag_url: string | null;
  id: number;
  name: string;
  short_name: string;
}

export namespace Team {
  export interface Extended extends Team {
    cover_url: string | null;
    created_at: Date;
    default_ruleset_id: Ruleset;
    description: string | null;
    is_open: boolean;
    empty_slots: number;
    leader: User.WithCountryCoverGroupsTeam;
    members: User.WithCountryCoverGroupsTeam[];
    statistics: {
      team_id: Team["id"];
      ruleset_id: Ruleset;
      play_count: number;
      ranked_score: number;
      performance: number;
    };
  }

  /**
   * Get extensive data about whichever team you want!
   * @param user A team id, a team shortname or a `Team` object!
   * @param ruleset The data should be relevant to which ruleset? (defaults to the **team's default Ruleset**)
   */
  export async function getOne(
    this: API,
    team: Team["id"] | Team["short_name"] | Team,
    ruleset?: Ruleset,
  ): Promise<Extended> {
    const mode = ruleset !== undefined ? Ruleset[ruleset] : "";
    if (typeof team === "string") {
      team = "@" + team; // `team` is the short_name, so use the @ prefix
    }
    if (typeof team === "object") {
      team = team.id;
    }
    return await this.request("get", ["teams", team, mode]);
  }
}
