{
  description = "A helper to calculate ";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { nixpkgs, flake-utils, rust-overlay, ... }:
    let 
      overlays = [ 
        (import rust-overlay)
        (self: super: {
          rustToolchain = super.rust-bin.stable.latest.default.override {
            extensions = [ "rust-src" "rust-analyzer" ];
          };
        })
      ];
    in flake-utils.lib.eachDefaultSystem(system:
      let 
        pkgs = import nixpkgs { inherit system overlays; };
      in
      {
        devShells = {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              pkg-config
              sqlite
              sqlx-cli
              rustToolchain
            ];
          };
        };
      }
    );
}
