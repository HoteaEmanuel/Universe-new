import { useNavigate } from "react-router-dom";
import { getAvatarColorClass, getInitials } from "../../chat/utils/avatarColor";
import type { GroupConversation } from "../../chat/types";

const SearchGroupRow = ({ group }: { group: GroupConversation }) => {
  const navigate = useNavigate();

  return (
    <li>
      <button
        type="button"
        onClick={() => navigate(`/groups/${group.id}`)}
        className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted cursor-pointer"
      >
        {group.coverImageUrl ? (
          <img
            src={group.coverImageUrl}
            alt={group.name}
            className="size-12 rounded-full object-cover"
          />
        ) : (
          <div
            className={`flex size-12 items-center justify-center rounded-full font-medium text-white ${getAvatarColorClass(group.id)}`}
          >
            {getInitials(group.name)}
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <p className="truncate font-medium">{group.name}</p>
          {group.description && (
            <p className="truncate text-sm text-muted-foreground">
              {group.description}
            </p>
          )}
        </div>
      </button>
    </li>
  );
};

export default SearchGroupRow;
