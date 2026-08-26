import LegalPageLayout from "./LegalPageLayout";

const TermsOfService = () => {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="August 26, 2026">
      <section className="flex flex-col gap-3">
        <p>
          These Terms of Service govern your use of Universe. By creating
          an account or otherwise using the app, you agree to these terms.
          If you don't agree, please don't use Universe.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Eligibility &amp; accounts</h2>
        <p>
          You need a valid email address to register, and university
          accounts may be reviewed before they're verified. You're
          responsible for the accuracy of the information you provide and
          for keeping your password confidential. You're responsible for
          all activity that happens under your account.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Acceptable use</h2>
        <p>When using Universe, you agree not to:</p>
        <ul>
          <li>Harass, threaten, or impersonate other users</li>
          <li>Post content that is illegal, hateful, or infringes someone else's rights</li>
          <li>Attempt to access another user's account or bypass blocks and bans</li>
          <li>Use the app to send spam or unsolicited promotional content</li>
          <li>Interfere with or disrupt Universe's infrastructure or security</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Your content</h2>
        <p>
          You retain ownership of the posts, comments, messages, images,
          and other content you create on Universe. By posting content,
          you grant Universe a license to store, display, and distribute
          that content as needed to operate the app — for example, showing
          your posts to your followers or the audience you chose. You're
          responsible for the content you share and for having the rights
          to share it.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Moderation &amp; enforcement</h2>
        <p>
          We may remove content, restrict features, or suspend accounts
          that violate these terms or otherwise harm the Universe
          community. Group and event organizers may also remove or ban
          participants from spaces they manage.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Termination</h2>
        <p>
          You may stop using Universe and request deletion of your account
          at any time. We may suspend or terminate accounts that violate
          these terms.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Disclaimers &amp; liability</h2>
        <p>
          Universe is provided "as is" without warranties of any kind. To
          the fullest extent permitted by law, Universe and its team are
          not liable for indirect, incidental, or consequential damages
          arising from your use of the app.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Changes to these terms</h2>
        <p>
          We may update these Terms of Service from time to time. We'll
          update the "Last updated" date above when we do, and continued
          use of Universe after changes take effect means you accept the
          updated terms.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Contact</h2>
        <p>
          Questions about these terms can be directed to the Universe team
          through the app's support channels.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default TermsOfService;
