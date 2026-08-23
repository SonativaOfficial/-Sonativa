/* =========================================================
   SONATIVA — SUPABASE CORE
   File: assets/js/supabase.js
   ========================================================= */

import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm";


/* =========================================================
   CONFIG
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
          "x-client-info":
            "sonativa-web"
        }
      }
    }
  );


/* =========================================================
   AUTH HELPERS
========================================================= */

export async function getCurrentUser() {

  const {
    data,
    error
  } =
    await supabase.auth.getUser();

  if (error) {

    console.warn(
      "Sonativa user error:",
      error.message
    );

    return null;
  }

  return data?.user || null;
}


export async function getCurrentSession() {

  const {
    data,
    error
  } =
    await supabase.auth.getSession();

  if (error) {

    console.warn(
      "Sonativa session error:",
      error.message
    );

    return null;
  }

  return data?.session || null;
}


/* =========================================================
   AUTH STATE
========================================================= */

export function onAuthStateChange(
  callback
) {

  return supabase.auth.onAuthStateChange(
    callback
  );

}


/* =========================================================
   SIGN OUT
========================================================= */

export async function signOut() {

  const {
    error
  } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }

}


/* =========================================================
   DATABASE HELPERS
========================================================= */

export async function getProjects(
  userId
) {

  if (!userId) {
    return [];
  }

  const {
    data,
    error
  } =
    await supabase
      .from("projects")
      .select("*")
      .eq(
        "user_id",
        userId
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {

    console.error(
      "Projects query failed:",
      error
    );

    throw error;
  }

  return data || [];
}


/* =========================================================
   CREATE PROJECT
========================================================= */

export async function createProject(
  project
) {

  if (!project) {
    throw new Error(
      "Project data is required."
    );
  }

  const user =
    await getCurrentUser();

  if (!user) {
    throw new Error(
      "You must be logged in."
    );
  }

  const payload = {
    ...project,
    user_id: user.id
  };

  const {
    data,
    error
  } =
    await supabase
      .from("projects")
      .insert(payload)
      .select()
      .single();

  if (error) {

    console.error(
      "Project creation failed:",
      error
    );

    throw error;
  }

  return data;
}


/* =========================================================
   UPDATE PROJECT
========================================================= */

export async function updateProject(
  projectId,
  updates
) {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  const user =
    await getCurrentUser();

  if (!user) {
    throw new Error(
      "You must be logged in."
    );
  }

  const {
    data,
    error
  } =
    await supabase
      .from("projects")
      .update(updates)
      .eq(
        "id",
        projectId
      )
      .eq(
        "user_id",
        user.id
      )
      .select()
      .single();

  if (error) {

    console.error(
      "Project update failed:",
      error
    );

    throw error;
  }

  return data;
}


/* =========================================================
   DELETE PROJECT
========================================================= */

export async function deleteProject(
  projectId
) {

  if (!projectId) {
    throw new Error(
      "Project ID is required."
    );
  }

  const user =
    await getCurrentUser();

  if (!user) {
    throw new Error(
      "You must be logged in."
    );
  }

  const {
    error
  } =
    await supabase
      .from("projects")
      .delete()
      .eq(
        "id",
        projectId
      )
      .eq(
        "user_id",
        user.id
      );

  if (error) {

    console.error(
      "Project deletion failed:",
      error
    );

    throw error;
  }

  return true;
}


/* =========================================================
   SECURE RPC
========================================================= */

export async function callRPC(
  functionName,
  parameters = {}
) {

  if (!functionName) {
    throw new Error(
      "RPC function name is required."
    );
  }

  const {
    data,
    error
  } =
    await supabase.rpc(
      functionName,
      parameters
    );

  if (error) {

    console.error(
      `RPC ${functionName} failed:`,
      error
    );

    throw error;
  }

  return data;
}


/* =========================================================
   STORAGE
========================================================= */

export async function uploadFile(
  bucket,
  path,
  file,
  options = {}
) {

  if (!bucket || !path || !file) {

    throw new Error(
      "Bucket, path and file are required."
    );

  }

  const {
    data,
    error
  } =
    await supabase.storage
      .from(bucket)
      .upload(
        path,
        file,
        {
          upsert: false,
          ...options
        }
      );

  if (error) {

    console.error(
      "Storage upload failed:",
      error
    );

    throw error;
  }

  return data;
}


/* =========================================================
   STORAGE PUBLIC URL
========================================================= */

export function getPublicFileUrl(
  bucket,
  path
) {

  const {
    data
  } =
    supabase.storage
      .from(bucket)
      .getPublicUrl(path);

  return data?.publicUrl || null;
}


/* =========================================================
   CONNECTION TEST
========================================================= */

export async function testSupabase() {

  try {

    const {
      error
    } =
    await supabase
      .from("projects")
      .select("id")
      .limit(1);

    if (error) {

      console.warn(
        "Supabase connection test:",
        error.message
      );

      return false;
    }

    return true;

  } catch (error) {

    console.error(
      "Supabase connection test failed:",
      error
    );

    return false;
  }

}


/* =========================================================
   GLOBAL SONATIVA API
========================================================= */

window.SonativaSupabase = {

  client:
    supabase,

  getCurrentUser,

  getCurrentSession,

  getProjects,

  createProject,

  updateProject,

  deleteProject,

  callRPC,

  uploadFile,

  getPublicFileUrl,

  testSupabase,

  signOut

};
