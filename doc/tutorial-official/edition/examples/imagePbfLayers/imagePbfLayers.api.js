/**
 * 예제 UI와 GeOnDT API 의미를 연결하는 API Help Registry입니다.
 */
export const apiHelp = {
    showLayer: {
        title: 'U3dAPP.addLayer / showLayer / removeLayer',
        description: '버튼 하나가 `레이어 종류 × 데이터` 조합 하나를 맡습니다. 두 레이어 모두 타일 URL을 바꾸는 API가 없어 조합마다 레이어를 따로 두되, 처음 켤 때 한 번만 만들고 그 뒤로는 `showLayer`로 보이기·숨기기만 바꿉니다. 제거하면 타일 캐시가 사라져 다시 켤 때 처음부터 그리지만, 숨기면 캐시가 남아 곧바로 붙습니다. 이미지 레이어는 Polygon만 그리므로 도로·하천은 켜도 그려지는 내용이 없습니다.',
        getCode(context, example) {
            const root = context.elements.root;
            const chip = root.querySelector('[data-layer-chip]:hover')
                ?? root.querySelector('[data-layer-chip].is-active')
                ?? root.querySelector('[data-layer-chip]');
            if (!chip) return '';

            const kindKey = chip.getAttribute('data-kind');
            const sourceKey = chip.getAttribute('data-source');
            const source = example?.sources?.[sourceKey];
            const kind = example?.kinds?.[kindKey];
            const folder = source ? source.folder : 'buildings';
            const name = (kind ? kind.prefix : 'pbf') + '-' + sourceKey;
            const baseurl = `https://3d-dev.geon.kr/data/pbf/osm/${folder}/{z}/{x}/{-y}.pbf`;
            const layerClass = kindKey === 'image' ? 'U3dImagePBFLayer' : 'U3dVectorPBFLayer';
            const styleOption = kindKey === 'image'
                ? 'imagePbfStyleFunction'
                : 'createGisOsmVectorStyle()';

            return [
                `// 처음 켤 때 한 번만 만듭니다`,
                `app.addLayer(new GeOnDT.image.${layerClass}({`,
                `    name: '${name}',`,
                `    baseurl: '${baseurl}',`,
                `    minlevel: 11, maxlevel: 19, realMaxlevel: 16,`,
                `    styleFunction: ${styleOption}`,
                `}));`,
                `app.showLayer('${name}', true);`,
                ``,
                `// 끌 때는 제거가 아니라 숨김 — 캐시가 남아 다시 켤 때 곧바로 붙습니다`,
                `app.showLayer('${name}', false);`,
                ``,
                `// 예제를 떠날 때만 제거합니다`,
                `app.removeLayer('${name}');`
            ].join('\n');
        }
    }
};
