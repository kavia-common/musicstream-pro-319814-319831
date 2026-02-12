import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app shell with sidebar navigation", () => {
  render(<App />);

  expect(screen.getByText(/MusicStream/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Home/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Search/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Your Library/i })).toBeInTheDocument();
});
