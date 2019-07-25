import { acceptance } from "helpers/qunit-helpers";

acceptance("discourse-elasticsearch", { loggedIn: true });

test("discourse-elasticsearch works", async assert => {
  await visit("/admin/plugins/discourse-elasticsearch");

  assert.ok(false, "it shows the discourse-elasticsearch button");
});
