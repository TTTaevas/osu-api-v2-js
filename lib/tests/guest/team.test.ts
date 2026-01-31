import { expect } from "chai";
import { validate, Test } from "../exports.js";

const getTeam: Test = async (api) => {
  const team = await api.getTeam(1);
  expect(team.id).to.equal(1);
  expect(team.leader.id).to.equal(2);
  expect(validate(team, "Team.Extended")).to.be.true;
  return true;
};

export const tests = [getTeam];
