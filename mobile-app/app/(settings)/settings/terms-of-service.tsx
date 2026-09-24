import LegalScreenLayout, { type LegalSectionData } from "@components/settings/LegalScreenLayout";

const SECTIONS: LegalSectionData[] = [
  {
    blocks: [
      {
        type: "paragraph",
        text: "These Terms of Service govern your use of Universe. By creating an account or otherwise using the app, you agree to these terms. If you don't agree, please don't use Universe.",
      },
    ],
  },
  {
    heading: "Eligibility & accounts",
    blocks: [
      {
        type: "paragraph",
        text: "You need a valid email address to register, and university accounts may be reviewed before they're verified. You're responsible for the accuracy of the information you provide and for keeping your password confidential. You're responsible for all activity that happens under your account.",
      },
    ],
  },
  {
    heading: "Acceptable use",
    blocks: [
      { type: "paragraph", text: "When using Universe, you agree not to:" },
      {
        type: "list",
        items: [
          "Harass, threaten, or impersonate other users",
          "Post content that is illegal, hateful, or infringes someone else's rights",
          "Attempt to access another user's account or bypass blocks and bans",
          "Use the app to send spam or unsolicited promotional content",
          "Interfere with or disrupt Universe's infrastructure or security",
        ],
      },
    ],
  },
  {
    heading: "Your content",
    blocks: [
      {
        type: "paragraph",
        text: "You retain ownership of the posts, comments, messages, images, and other content you create on Universe. By posting content, you grant Universe a license to store, display, and distribute that content as needed to operate the app — for example, showing your posts to your followers or the audience you chose. You're responsible for the content you share and for having the rights to share it.",
      },
    ],
  },
  {
    heading: "Moderation & enforcement",
    blocks: [
      {
        type: "paragraph",
        text: "We may remove content, restrict features, or suspend accounts that violate these terms or otherwise harm the Universe community. Group and event organizers may also remove or ban participants from spaces they manage.",
      },
    ],
  },
  {
    heading: "Termination",
    blocks: [
      {
        type: "paragraph",
        text: "You may stop using Universe and request deletion of your account at any time. We may suspend or terminate accounts that violate these terms.",
      },
    ],
  },
  {
    heading: "Disclaimers & liability",
    blocks: [
      {
        type: "paragraph",
        text: 'Universe is provided "as is" without warranties of any kind. To the fullest extent permitted by law, Universe and its team are not liable for indirect, incidental, or consequential damages arising from your use of the app.',
      },
    ],
  },
  {
    heading: "Changes to these terms",
    blocks: [
      {
        type: "paragraph",
        text: 'We may update these Terms of Service from time to time. We\'ll update the "Last updated" date above when we do, and continued use of Universe after changes take effect means you accept the updated terms.',
      },
    ],
  },
  {
    heading: "Contact",
    blocks: [
      {
        type: "paragraph",
        text: "Questions about these terms can be directed to the Universe team through the app's support channels.",
      },
    ],
  },
];

const TermsOfService = () => (
  <LegalScreenLayout title="Terms of Service" lastUpdated="August 26, 2026" sections={SECTIONS} />
);

export default TermsOfService;
