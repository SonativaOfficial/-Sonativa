/* =========================================================
   SONATIVA — SUPABASE CORE
   Version: 2026
   Authentication + Database + Session Management
   ========================================================= */

import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const SUPABASE_URL =
  "https://kallobeodjzzhrsaqszw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_JH5v7Fix_d6HsHcRX2_vmw_wRVNLOkX";

/* =========================================================
   CLIENT
   ========================================================= */

export const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce"
      },
      global: {
        headers: {
          "x-application-name": "Sonativa"
        }
      }
    }
  );

/* =========================================================
   SESSION
   ========================================================= */

export async function getSession() {

  try {

    const {
      data,
      error
    } =
      await supabase.auth.getSession();

    if (error) {
      console.error(
        "[Sonativa Auth] Session error:",
        error.message
      );

      return null;
    }

    return data?.session || null;

  } catch (error) {

    console.error(
      "[Sonativa Auth] Session exception:",
      error
    );

    return null;
  }
}

/* =========================================================
   CURRENT USER
   ========================================================= */

export async function getUser() {

  try {

    const {
      data,
      error
    } =
      await supabase.auth.getUser();

    if (error) {

      console.warn(
        "[Sonativa Auth] User error:",
        error.message
      );

      return null;
    }

    return data?.user || null;

  } catch (error) {

    console.error(
      "[Sonativa Auth] User exception:",
      error
    );

    return null;
  }
}

/* =========================================================
   AUTH STATE LISTENER
   ========================================================= */

export function onAuthStateChange(
  callback
) {

  if (
    typeof callback !== "function"
  ) {
    return {
      unsubscribe() {}
    };
  }

  const {
    data
  } =
    supabase.auth.onAuthStateChange(
      (event, session) => {

        try {

          callback(
            event,
            session
          );

        } catch (error) {

          console.error(
            "[Sonativa Auth] Listener error:",
            error
          );
        }

      }
    );

  return data.subscription;
}

/* =========================================================
   SIGN OUT
   ========================================================= */

export async function signOut() {

  try {

    const {
      error
    } =
      await supabase.auth.signOut();

    if (error) {

      console.error(
        "[Sonativa Auth] Sign out error:",
        error.message
      );

      return {
        success: false,
        error
      };
    }

    return {
      success: true,
      error: null
    };

  } catch (error) {

    console.error(
      "[Sonativa Auth] Sign out exception:",
      error
    );

    return {
      success: false,
      error
    };
  }
}

/* =========================================================
   DATABASE HELPERS
   ========================================================= */

export async function select(
  table,
  columns = "*",
  options = {}
) {

  if (!table) {
    throw new Error(
      "Supabase table name is required."
    );
  }

  let query =
    supabase
      .from(table)
      .select(columns);

  if (options.eq) {

    for (
      const [column, value]
      of Object.entries(options.eq)
    ) {

      query =
        query.eq(
          column,
          value
        );
    }
  }

  if (options.order) {

    query =
      query.order(
        options.order.column,
        {
          ascending:
            options.order.ascending !== false
        }
      );
  }

  if (
    Number.isInteger(
      options.limit
    )
  ) {

    query =
      query.limit(
        options.limit
      );
  }

  if (
    Number.isInteger(
      options.rangeFrom
    ) &&
    Number.isInteger(
      options.rangeTo
    )
  ) {

    query =
      query.range(
        options.rangeFrom,
        options.rangeTo
      );
  }

  const {
    data,
    error
  } =
    await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   INSERT
   ========================================================= */

export async function insert(
  table,
  values
) {

  if (!table) {
    throw new Error(
      "Supabase table name is required."
    );
  }

  const {
    data,
    error
  } =
    await supabase
      .from(table)
      .insert(values)
      .select();

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   UPDATE
   ========================================================= */

export async function update(
  table,
  values,
  filters = {}
) {

  if (!table) {
    throw new Error(
      "Supabase table name is required."
    );
  }

  let query =
    supabase
      .from(table)
      .update(values);

  for (
    const [column, value]
    of Object.entries(filters)
  ) {

    query =
      query.eq(
        column,
        value
      );
  }

  const {
    data,
    error
  } =
    await query
      .select();

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   DELETE
   ========================================================= */

export async function remove(
  table,
  filters = {}
) {

  if (!table) {
    throw new Error(
      "Supabase table name is required."
    );
  }

  let query =
    supabase
      .from(table)
      .delete();

  for (
    const [column, value]
    of Object.entries(filters)
  ) {

    query =
      query.eq(
        column,
        value
      );
  }

  const {
    data,
    error
  } =
    await query
      .select();

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   RPC
   ========================================================= */

export async function rpc(
  functionName,
  params = {}
) {

  if (!functionName) {
    throw new Error(
      "Supabase RPC function name is required."
    );
  }

  const {
    data,
    error
  } =
    await supabase.rpc(
      functionName,
      params
    );

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   FOUNDER VERIFICATION
   ========================================================= */

export async function isFounder() {

  try {

    const {
      data,
      error
    } =
      await supabase.rpc(
        "is_sonativa_founder"
      );

    if (error) {

      console.warn(
        "[Sonativa Founder] Verification failed:",
        error.message
      );

      return false;
    }

    return data === true;

  } catch (error) {

    console.error(
      "[Sonativa Founder] Exception:",
      error
    );

    return false;
  }
}

/* =========================================================
   USER PROJECTS
   ========================================================= */

export async function getUserProjects() {

  const user =
    await getUser();

  if (!user) {
    return [];
  }

  return select(
    "projects",
    `
      id,
      user_id,
      project_name,
      token_name,
      token_symbol,
      total_supply,
      decimals,
      network,
      description,
      metadata_uri,
      token_status,
      mint_address,
      created_at,
      updated_at
    `,
    {
      eq: {
        user_id: user.id
      },
      order: {
        column: "created_at",
        ascending: false
      }
    }
  );
}

/* =========================================================
   CREATE PROJECT
   ========================================================= */

export async function createProject(
  project
) {

  const user =
    await getUser();

  if (!user) {

    throw new Error(
      "You must be signed in to create a project."
    );
  }

  const payload = {
    ...project,
    user_id: user.id
  };

  return insert(
    "projects",
    payload
  );
}

/* =========================================================
   UPDATE PROJECT
   ========================================================= */

export async function updateProject(
  projectId,
  values
) {

  const user =
    await getUser();

  if (!user) {

    throw new Error(
      "You must be signed in."
    );
  }

  return update(
    "projects",
    values,
    {
      id: projectId,
      user_id: user.id
    }
  );
}

/* =========================================================
   REALTIME
   ========================================================= */

export function subscribe(
  table,
  callback,
  options = {}
) {

  if (!table) {
    throw new Error(
      "Realtime table name is required."
    );
  }

  const channelName =
    options.channel ||
    `sonativa:${table}:${Date.now()}`;

  const channel =
    supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event:
            options.event || "*",
          schema:
            options.schema || "public",
          table
        },
        (payload) => {

          try {

            callback(
              payload
            );

          } catch (error) {

            console.error(
              "[Sonativa Realtime] Callback error:",
              error
            );
          }
        }
      )
      .subscribe();

  return {
    channel,

    unsubscribe: async () => {

      await supabase
        .removeChannel(
          channel
        );
    }
  };
}

/* =========================================================
   GLOBAL EXPORT
   ========================================================= */

window.SonativaSupabase = {
  client: supabase,
  getSession,
  getUser,
  onAuthStateChange,
  signOut,
  select,
  insert,
  update,
  remove,
  rpc,
  isFounder,
  getUserProjects,
  createProject,
  updateProject,
  subscribe
};

console.info(
  "Sonativa Supabase initialized."
);
