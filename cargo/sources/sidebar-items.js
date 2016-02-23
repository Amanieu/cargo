initSidebarItems({"mod":[["git",""],["path",""],["registry","A `Source` for registry-based packages.What's a Registry?Registries are central locations where packages can be uploaded to, discovered, and searched for. The purpose of a registry is to have a location that serves as permanent storage for versions of a crate over time.Compared to git sources, a registry provides many packages as well as many versions simultaneously. Git sources can also have commits deleted through rebasings where registries cannot have their versions deleted.The Index of a RegistryOne of the major difficulties with a registry is that hosting so many packages may quickly run into performance problems when dealing with dependency graphs. It's infeasible for cargo to download the entire contents of the registry just to resolve one package's dependencies, for example. As a result, cargo needs some efficient method of querying what packages are available on a registry, what versions are available, and what the dependencies for each version is.One method of doing so would be having the registry expose an HTTP endpoint which can be queried with a list of packages and a response of their dependencies and versions is returned. This is somewhat inefficient however as we may have to hit the endpoint many times and we may have already queried for much of the data locally already (for other packages, for example). This also involves inventing a transport format between the registry and Cargo itself, so this route was not taken.Instead, Cargo communicates with registries through a git repository referred to as the Index. The Index of a registry is essentially an easily query-able version of the registry's database for a list of versions of a package as well as a list of dependencies for each version.Using git to host this index provides a number of benefits:The entire index can be stored efficiently locally on disk. This means that all queries of a registry can happen locally and don't need to touch the network.Updates of the index are quite efficient. Using git buys incremental updates, compressed transmission, etc for free. The index must be updated each time we need fresh information from a registry, but this is one update of a git repository that probably hasn't changed a whole lot so it shouldn't be too expensive.Additionally, each modification to the index is just appending a line at the end of a file (the exact format is described later). This means that the commits for an index are quite small and easily applied/compressable.The format of the IndexThe index is a store for the list of versions for all packages known, so its format on disk is optimized slightly to ensure that `ls registry` doesn't produce a list of all packages ever known. The index also wants to ensure that there's not a million files which may actually end up hitting filesystem limits at some point. To this end, a few decisions were made about the format of the registry:Each crate will have one file corresponding to it. Each version for a crate will just be a line in this file. There will be two tiers of directories for crate names, under which crates corresponding to those tiers will be located. As an example, this is an example hierarchy of an index:The root of the index contains a `config.json` file with a few entries corresponding to the registry (see `RegistryConfig` below).Otherwise, there are three numbered directories (1, 2, 3) for crates with names 1, 2, and 3 characters in length. The 1/2 directories simply have the crate files underneath them, while the 3 directory is sharded by the first letter of the crate name.Otherwise the top-level directory contains many two-letter directory names, each of which has many sub-folders with two letters. At the end of all these are the actual crate files themselves.The purpose of this layout is to hopefully cut down on `ls` sizes as well as efficient lookup based on the crate name itself.Crate filesEach file in the index is the history of one crate over time. Each line in the file corresponds to one version of a crate, stored in JSON format (see the `RegistryPackage` structure below).As new versions are published, new lines are appended to this file. The only modifications to this file that should happen over time are yanks of a particular version.Downloading PackagesThe purpose of the Index was to provide an efficient method to resolve the dependency graph for a package. So far we only required one network interaction to update the registry's repository (yay!). After resolution has been performed, however we need to download the contents of packages so we can read the full manifest and build the source code.To accomplish this, this source's `download` method will make an HTTP request per-package requested to download tarballs into a local cache. These tarballs will then be unpacked into a destination folder.Note that because versions uploaded to the registry are frozen forever that the HTTP download and unpacking can all be skipped if the version has already been downloaded and unpacked. This caching allows us to only download a package when absolutely necessary.Filesystem HierarchyOverall, the `$HOME/.cargo` looks like this when talking about the registry:"]],"struct":[["GitSource",""]]});