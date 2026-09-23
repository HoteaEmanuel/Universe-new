type NameFields = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
};

export const getFullName = (user?: NameFields | null): string => {
  if (!user) return "User";
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  } else if (user.firstName) {
    return user.firstName;
  } else if (user.name) {
    return user.name;
  } else {
    return "User";
  }
};
