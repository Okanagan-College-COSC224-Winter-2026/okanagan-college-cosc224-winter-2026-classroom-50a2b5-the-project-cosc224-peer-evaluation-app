export const getToken = () => {
  return localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string).token : null;
}

export const removeToken = () => {
  localStorage.removeItem("user");
}

export const didExpire = (response: Response) => {
  // Response would be 401 if the token expired (or is otherwise invalid)
  return response.status === 401;
}

// TODO this is dangerous, we need to also ensure we do server-side isTeacher checks
export const isTeacher = () => {
  const user = JSON.parse(localStorage.getItem("user") || '{ "isTeacher": false }');
  return user.isTeacher;
}

export const logout = () => {
  // Remove token from local storage
  removeToken();

  window.location.href = '/';
}