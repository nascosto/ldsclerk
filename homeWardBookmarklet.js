javascript: (function () {
	const memberListUrl = 'https://www.lds.org/mls/mbr/services/report/member-list?lang=eng';
	const memberProfileUrl = 'https://www.lds.org/mls/mbr/records/member-profile/service/';
	const unitDetailsUrl = 'https://www.lds.org/mls/mbr/services/cdol/details/unit/';

	let csvMembersWithParents = 'Name,"Father\'s Name","Father\'s Unit","Father\'s Unit Name","Mother\'s Name","Mother\'s Unit","Mother\'s Unit Name"\n';

	let memberProfileCounter;

	generateHomeWardList();

	function generateHomeWardList() {
		requestJson(memberListUrl)
			.then(response => onGetMemberListSuccess(response))
			.catch(() => console.error('Failed to get member list.'));
	}

	function onGetMemberListSuccess(list) {
		memberProfileCounter = list.length;
		for (let i = 0; i < list.length; i++) {
			requestJson(`${memberProfileUrl}${list[i].id}?lang=eng`)
				.then(response => onGetMemberProfileSuccess(response))
				.catch(() => console.error(`Failed to get member profile ${list[i].id}`));
		}
	}

	function onGetMemberProfileSuccess(member) {
		let name = member.individual.name;
		let fatherName = member.family.parents && member.family.parents.father && member.family.parents.father.name ? member.family.parents.father.name : '';
		let fatherUnit = member.family.parents && member.family.parents.father && member.family.parents.father.unitNumber ? member.family.parents.father.unitNumber : '';
		let motherName = member.family.parents && member.family.parents.mother && member.family.parents.mother.name ? member.family.parents.mother.name : '';
		let motherUnit = member.family.parents && member.family.parents.mother && member.family.parents.mother.unitNumber ? member.family.parents.mother.unitNumber : '';

		let fatherUnitDetailsPromise = fatherUnit ? requestJson(`${unitDetailsUrl}${fatherUnit}?lang=eng`) : Promise.resolve({});
		let motherUnitDetailsPromise = motherUnit ? requestJson(`${unitDetailsUrl}${motherUnit}?lang=eng`) : Promise.resolve({});
		Promise.all([fatherUnitDetailsPromise, motherUnitDetailsPromise])
			.then(unitDetails => {
				csvMembersWithParents +=
					`"${name}","${fatherName}",${fatherUnit},"${unitDetails[0].title}",${motherName}",${motherUnit},"${unitDetails[1].title}"\n`;

				memberProfileCounter--;
				if (memberProfileCounter === 0) {
					saveMembersWithParents(csvMembersWithParents);
				}
			})
			.catch((e) => {
				console.error(`Failed to get parent unit details ${fatherUnit} ${motherUnit}`);
				console.error('Error: ' + e);
			});
	}

	function requestJson(url) {
		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest();
			xhr.onload = () => {
				if (xhr.status === 200 && xhr.status < 300) {
					resolve(JSON.parse(xhr.response));
				} else {
					reject({
						status: xhr.status,
						statusText: xhr.statusText
					});
				}
			};
			xhr.onerror = () => {
				reject({
					status: xhr.status,
					statusText: xhr.statusText
				});
			};
			xhr.open('GET', url);
			xhr.send();
		});
	}

	function saveMembersWithParents(text) {
		let blob = new Blob([text], { type: 'text/plain' });

		var a = document.createElement('a');
		a.style = 'display: none';
		a.href = window.URL.createObjectURL(blob);
		a.download = 'homeWard.csv';

		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	}
}());
