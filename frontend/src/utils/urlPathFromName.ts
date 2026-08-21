type NameFields = {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
};

export const urlPathName = (creator?: NameFields | null): string => {
  if (creator?.username) return creator.username;
  let fullName = "";
  if (creator?.firstName) {
    creator.firstName.split(" ").forEach((part) => {
      fullName += part + "-";
    });
  }
  if (creator?.lastName) {
    creator.lastName.split(" ").forEach((part) => {
      fullName += part + "-";
    });
  }
  if (creator?.name) {
    creator.name.split(" ").forEach((part) => {
      fullName += part + "-";
    });
  }
  if (fullName.endsWith("-")) {
    fullName = fullName.slice(0, -1);
  }
  return fullName;
};
